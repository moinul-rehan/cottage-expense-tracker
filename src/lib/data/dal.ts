import 'server-only'
import { cache } from 'react'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export { getDisplayName, getFullName } from './display-name'

export type Profile = {
  id: string
  cottage_id: string
  first_name: string
  last_name: string | null
  email: string | null
  role: 'super_admin' | 'member'
  room_label: string | null
  is_active: boolean
  avatar_url: string | null
  gender: 'male' | 'female' | 'other' | null
  hometown: string | null
  mobile_number: string | null
  address: string | null
  can_add_expenses: boolean
  can_add_bazaar: boolean
  can_add_meals: boolean
  can_add_deposit: boolean
  can_add_notice: boolean
  language: 'en' | 'bn'
  /** Cottage fields fetched in the same round trip as the profile (see
   * PROFILE_COLUMNS' embed below) - avoids every page re-querying `cottages`
   * separately for the active month key or cottage name. */
  cottage_name: string
  active_month_key: string
}

const PROFILE_COLUMNS =
  'id, cottage_id, first_name, last_name, email, role, room_label, is_active, avatar_url, gender, hometown, mobile_number, address, can_add_expenses, can_add_bazaar, can_add_meals, can_add_deposit, can_add_notice, language'

/**
 * Verifies the caller has an active Supabase session and loads their profile
 * (including role). Redirects to /login if not authenticated. Memoized per
 * request so calling this from multiple Server Components/Actions is cheap.
 */
export const getCurrentProfile = cache(async (): Promise<Profile> => {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: profile, error } = await supabase
    .from('profiles')
    .select(PROFILE_COLUMNS)
    .eq('id', user.id)
    .single()

  if (error || !profile) {
    // Sign out before redirecting: a lingering session with no matching
    // profile row (or a schema mismatch) would otherwise bounce forever
    // between the proxy's "authenticated -> /dashboard" and this
    // "profile missing -> /login" redirects.
    await supabase.auth.signOut()
    redirect('/login')
  }

  const { data: cottage } = await supabase
    .from('cottages')
    .select('name, active_month_key, status, suspended_at')
    .eq('id', profile.cottage_id)
    .maybeSingle()

  if (cottage?.status === 'pending') {
    redirect('/pending-approval')
  }

  if (cottage?.status === 'rejected') {
    redirect('/rejected')
  }

  if (cottage?.suspended_at) {
    redirect('/suspended')
  }

  return {
    ...profile,
    cottage_name: cottage?.name ?? '',
    active_month_key: cottage?.active_month_key ?? new Date().toISOString().slice(0, 7),
  }
})

export type ActiveMember = { id: string; first_name: string; last_name: string | null; avatar_url: string | null }

/**
 * Every active member of the cottage - dedupe point for the "members" list
 * that both the shared (house) layout and most individual pages need each
 * render. cache()-wrapped so calling it from the layout AND a page in the
 * same request costs one round trip, not two.
 */
export const getActiveMembers = cache(async (cottageId: string): Promise<ActiveMember[]> => {
  const supabase = await createClient()
  const { data } = await supabase
    .from('profiles')
    .select('id, first_name, last_name, avatar_url')
    .eq('cottage_id', cottageId)
    .eq('is_active', true)
    .order('last_name')
  return data ?? []
})

/** Same as getCurrentProfile but also enforces super_admin role. */
export async function requireSuperAdmin(): Promise<Profile> {
  const profile = await getCurrentProfile()
  if (profile.role !== 'super_admin') {
    redirect('/dashboard')
  }
  return profile
}
