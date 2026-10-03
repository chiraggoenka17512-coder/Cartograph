import { auth, clerkClient, currentUser } from "@clerk/nextjs/server";

export interface UserOrgState {
  userId: string | null;
  orgId: string | null | undefined;
  orgSlug: string | null | undefined;
  orgRole: string | null | undefined;
  pendingOrgIdToActivate?: string;
}

/**
 * Ensures that a signed-in user belongs to an organization.
 * 
 * - If the user has an active organization in their token, returns it.
 * - If the user has existing organization memberships but none is active in the session,
 *   identifies the first organization so it can be activated immediately.
 * - If the user has never created or joined an organization (e.g. brand new account),
 *   automatically creates one so they land in a team workspace without being asked to make one.
 */
export async function ensureUserOrganization(): Promise<UserOrgState> {
  const { userId, orgId, orgSlug, orgRole } = await auth();

  if (!userId) {
    return {
      userId: null,
      orgId: null,
      orgSlug: null,
      orgRole: null,
    };
  }

  if (orgId) {
    return {
      userId,
      orgId,
      orgSlug,
      orgRole,
    };
  }

  const client = await clerkClient();
  const memberships = await client.users.getOrganizationMembershipList({ userId, limit: 10 });

  if (memberships.data && memberships.data.length > 0) {
    const firstOrg = memberships.data[0].organization;
    return {
      userId,
      orgId: null,
      orgSlug: null,
      orgRole: null,
      pendingOrgIdToActivate: firstOrg.id,
    };
  }

  // Brand new account: automatically create an organization for them
  const user = await currentUser();
  const displayName =
    user?.firstName ||
    user?.username ||
    user?.primaryEmailAddress?.emailAddress?.split("@")[0] ||
    "Personal";

  const newOrg = await client.organizations.createOrganization({
    name: `${displayName}'s Workspace`,
    createdBy: userId,
  });

  return {
    userId,
    orgId: null,
    orgSlug: null,
    orgRole: null,
    pendingOrgIdToActivate: newOrg.id,
  };
}
