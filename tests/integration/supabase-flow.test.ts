/**
 * Testes de integração com Supabase real.
 * Executam apenas se SUPABASE_SERVICE_ROLE_KEY estiver definida em .env.local
 *
 * npm run test:integration
 */
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import WebSocket from "ws";
import { DEFAULT_ACTIVITIES } from "@/lib/constants/activities";
import { evaluateCheckinLimits } from "@/lib/checkin-rules";
import { filterPublicFeedCheckins } from "@/lib/checkin-rules";
import { buildRanking } from "@/lib/stats";
import { generateInviteCode } from "@/lib/invite-code";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const runIntegration = Boolean(SUPABASE_URL && SERVICE_KEY);

function createNodeSupabaseClient(url: string, key: string) {
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
    realtime: { transport: WebSocket as never },
  });
}

describe.skipIf(!runIntegration)("Integração Supabase — fluxo completo", () => {
  let admin: SupabaseClient;
  let testUserId: string;
  let testEmail: string;
  let testPassword: string;
  let groupId: string;
  let activityId: string;
  let publicCheckinId: string;
  let privateCheckinId: string;

  beforeAll(async () => {
    admin = createNodeSupabaseClient(SUPABASE_URL!, SERVICE_KEY!);

    testEmail = `test-${Date.now()}@pray-rats.test`;
    testPassword = "testpass123";

    const { data: authData, error: authError } = await admin.auth.admin.createUser({
      email: testEmail,
      password: testPassword,
      email_confirm: true,
      user_metadata: { name: "Usuário Teste" },
    });

    expect(authError).toBeNull();
    expect(authData.user).toBeTruthy();
    testUserId = authData.user!.id;

    // Aguarda trigger de profile
    await new Promise((r) => setTimeout(r, 500));

    const { data: profile } = await admin
      .from("profiles")
      .select("*")
      .eq("id", testUserId)
      .single();

    expect(profile).toBeTruthy();
    expect(profile!.email).toBe(testEmail);
    expect(profile!.name).toBe("Usuário Teste");
  });

  afterAll(async () => {
    if (!testUserId) return;

    if (groupId) {
      await admin.from("groups").delete().eq("id", groupId);
    }

    await admin.auth.admin.deleteUser(testUserId);
  });

  it("1. profile criado automaticamente após signup", async () => {
    const { data } = await admin
      .from("profiles")
      .select("id, name, email")
      .eq("id", testUserId)
      .single();

    expect(data?.name).toBe("Usuário Teste");
    expect(data?.email).toBe(testEmail);
  });

  it("2. cria grupo com invite_code e admin", async () => {
    const inviteCode = generateInviteCode();

    const { data: group, error } = await admin
      .from("groups")
      .insert({
        name: "Grupo Teste Automatizado",
        description: "Criado por teste de integração",
        invite_code: inviteCode,
        created_by: testUserId,
      })
      .select("id, invite_code")
      .single();

    expect(error).toBeNull();
    expect(group).toBeTruthy();
    groupId = group!.id;

    const { error: memberError } = await admin.from("group_members").insert({
      group_id: groupId,
      user_id: testUserId,
      role: "admin",
    });
    expect(memberError).toBeNull();

    const activities = DEFAULT_ACTIVITIES.map((a) => ({
      group_id: groupId,
      ...a,
    }));

    const { error: actError } = await admin
      .from("activity_types")
      .insert(activities);
    expect(actError).toBeNull();

    const { data: activitiesDb } = await admin
      .from("activity_types")
      .select("id, name")
      .eq("group_id", groupId);

    expect(activitiesDb).toHaveLength(9);
    activityId =
      activitiesDb!.find((a) => a.name === "Oração pessoal")!.id;
  });

  it("3. cria check-in público com pontuação correta", async () => {
    const activity = {
      name: "Oração pessoal",
      points: 5,
      daily_limit: 1,
      weekly_limit: null,
    };

    const validation = evaluateCheckinLimits(activity, { daily: 0, weekly: 0 });
    expect(validation.allowed).toBe(true);
    expect(validation.points).toBe(5);

    const { data: checkin, error } = await admin
      .from("checkins")
      .insert({
        group_id: groupId,
        user_id: testUserId,
        activity_type_id: activityId,
        title: "Oração da manhã",
        points: validation.points,
        visibility: "public",
        status: "valid",
      })
      .select("id, points")
      .single();

    expect(error).toBeNull();
    expect(checkin!.points).toBe(5);
    publicCheckinId = checkin!.id;
  });

  it("4. bloqueia segundo check-in no limite diário (regra de negócio)", () => {
    const activity = {
      name: "Oração pessoal",
      points: 5,
      daily_limit: 1,
      weekly_limit: null,
    };

    const validation = evaluateCheckinLimits(activity, { daily: 1, weekly: 0 });
    expect(validation.allowed).toBe(false);
    expect(validation.message).toContain("Limite diário");
  });

  it("5. check-in privado não aparece no feed", async () => {
    const missaActivity = (
      await admin
        .from("activity_types")
        .select("id")
        .eq("group_id", groupId)
        .eq("name", "Santa Missa")
        .single()
    ).data!;

    const { data: privateCheckin } = await admin
      .from("checkins")
      .insert({
        group_id: groupId,
        user_id: testUserId,
        activity_type_id: missaActivity.id,
        title: "Missa privada",
        points: 20,
        visibility: "private",
        status: "valid",
      })
      .select("id")
      .single();

    privateCheckinId = privateCheckin!.id;

    const { data: allCheckins } = await admin
      .from("checkins")
      .select("id, visibility, status")
      .eq("group_id", groupId);

    const feed = filterPublicFeedCheckins(allCheckins ?? []);
    expect(feed.some((c) => c.id === publicCheckinId)).toBe(true);
    expect(feed.some((c) => c.id === privateCheckinId)).toBe(false);
  });

  it("6. ranking agrega pontos corretamente", async () => {
    const { data: checkins } = await admin
      .from("checkins")
      .select("user_id, points, profiles(name, avatar_url)")
      .eq("group_id", groupId)
      .eq("status", "valid");

    const entries = (checkins ?? []).map((c) => ({
      user_id: c.user_id,
      name: (c.profiles as { name: string }).name,
      avatar_url: (c.profiles as { avatar_url: string | null }).avatar_url,
      points: c.points,
    }));

    const ranking = buildRanking(entries);
    expect(ranking[0].user_id).toBe(testUserId);
    expect(ranking[0].total_points).toBe(25); // 5 + 20
    expect(ranking[0].total_checkins).toBe(2);
  });

  it("7. join_group_by_invite adiciona membro via RPC", async () => {
    const joinEmail = `join-${Date.now()}@pray-rats.test`;
    const joinPassword = "testpass123";

    const { data: joinAuth } = await admin.auth.admin.createUser({
      email: joinEmail,
      password: joinPassword,
      email_confirm: true,
      user_metadata: { name: "Membro Teste" },
    });

    const joinUserId = joinAuth.user!.id;
    await new Promise((r) => setTimeout(r, 300));

    const userClient = createNodeSupabaseClient(
      SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    );
    const { error: signInError } = await userClient.auth.signInWithPassword({
      email: joinEmail,
      password: joinPassword,
    });
    expect(signInError).toBeNull();

    const { data: group } = await admin
      .from("groups")
      .select("invite_code")
      .eq("id", groupId)
      .single();

    const { data: joinedGroupId, error: rpcError } = await userClient.rpc(
      "join_group_by_invite",
      { invite: group!.invite_code },
    );

    expect(rpcError).toBeNull();
    expect(joinedGroupId).toBe(groupId);

    const { data: members } = await admin
      .from("group_members")
      .select("user_id, role")
      .eq("group_id", groupId);

    expect(members!.some((m) => m.user_id === joinUserId && m.role === "member")).toBe(true);

    await admin.from("group_members").delete().eq("user_id", joinUserId);
    await admin.auth.admin.deleteUser(joinUserId);
  });

  it("8. create_checkin_safely evita race condition no limite diário", async () => {
    const { data: activity, error: activityError } = await admin
      .from("activity_types")
      .insert({
        group_id: groupId,
        name: `Atividade concorrente ${Date.now()}`,
        description: "Atividade para teste de concorrência da RPC",
        points: 9,
        daily_limit: 1,
        weekly_limit: 1,
        is_active: true,
      })
      .select("id")
      .single();

    expect(activityError).toBeNull();

    const userClient = createNodeSupabaseClient(
      SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    );

    const { error: signInError } = await userClient.auth.signInWithPassword({
      email: testEmail,
      password: testPassword,
    });
    expect(signInError).toBeNull();

    const payload = {
      group_id: groupId,
      activity_type_id: activity!.id,
      title: "Check-in concorrente",
      description: "Teste de corrida",
      duration_minutes: 15,
      distance_km: 1.25,
      visibility: "public" as const,
      image_url: null,
    };

    const [resultA, resultB] = await Promise.all([
      userClient.rpc("create_checkin_safely", payload),
      userClient.rpc("create_checkin_safely", payload),
    ]);

    const results = [resultA, resultB];
    const successCount = results.filter((result) => Boolean(result.data)).length;
    const dailyLimitErrors = results.filter((result) =>
      String(result.error?.message ?? "").includes("DAILY_LIMIT_REACHED"),
    ).length;

    expect(successCount).toBe(1);
    expect(dailyLimitErrors).toBe(1);

    const { count, error: countError } = await admin
      .from("checkins")
      .select("*", { count: "exact", head: true })
      .eq("group_id", groupId)
      .eq("user_id", testUserId)
      .eq("activity_type_id", activity!.id)
      .eq("status", "valid");

    expect(countError).toBeNull();
    expect(count).toBe(1);
  });
});
