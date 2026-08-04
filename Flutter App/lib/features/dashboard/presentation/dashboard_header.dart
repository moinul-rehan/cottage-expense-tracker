import 'package:flutter/material.dart';
import '../../../core/models/profile.dart';
import '../../../core/theme/theme.dart';
import '../../../core/utils/format_month.dart';
import '../../notifications/presentation/notification_bell.dart';
import 'verified_badge.dart';

/// The orange band across the top of the Dashboard, styled after the Rento
/// Figma kit's mobile home-screen header: a nav row (logo, decorative
/// language pill, theme toggle, notification bell, avatar) over a centered
/// greeting. Bleeds behind the top half of [DashboardSummaryCard], which
/// overlaps its bottom edge with a negative top margin from the caller.
///
/// The greeting copy/logic ("Welcome, {name}" + cottage name + "Here's
/// where things stand for {month}") mirrors the existing header text this
/// screen already rendered above the stat cards, and the web app's
/// src/app/(house)/dashboard/MobileDashboardHero.tsx -- just restyled to sit
/// centered inside the band instead of as a separate section above it.
class DashboardHeader extends StatelessWidget {
  final Profile profile;
  final String cottageName;
  final String monthKey;

  const DashboardHeader({
    super.key,
    required this.profile,
    required this.cottageName,
    required this.monthKey,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.fromLTRB(16, 8, 16, 64),
      decoration: const BoxDecoration(
        color: CottageColors.primary,
        borderRadius: BorderRadius.only(
          bottomLeft: Radius.circular(28),
          bottomRight: Radius.circular(28),
        ),
      ),
      child: SafeArea(
        bottom: false,
        child: Column(
          children: [
            _NavRow(profile: profile),
            const SizedBox(height: 20),
            Text(
              'Welcome, ${profile.displayName}',
              textAlign: TextAlign.center,
              style: const TextStyle(
                fontSize: 24,
                fontWeight: FontWeight.bold,
                color: CottageColors.primaryForeground,
              ),
            ),
            const SizedBox(height: 2),
            VerifiedBadge(isSuperAdmin: profile.isSuperAdmin, defaultColor: CottageColors.primaryForeground),
            if (cottageName.isNotEmpty) ...[
              const SizedBox(height: 4),
              Text(
                cottageName,
                textAlign: TextAlign.center,
                style: const TextStyle(
                  fontSize: 20,
                  fontWeight: FontWeight.w500,
                  color: CottageColors.primaryForeground,
                ),
              ),
            ],
            const SizedBox(height: 6),
            RichText(
              textAlign: TextAlign.center,
              text: TextSpan(
                style: const TextStyle(fontSize: 14, color: CottageColors.primaryForeground),
                children: [
                  const TextSpan(text: "Here's where things stand for "),
                  TextSpan(
                    text: formatMonthKey(monthKey),
                    style: const TextStyle(fontWeight: FontWeight.bold),
                  ),
                  const TextSpan(text: '.'),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

/// Logo + decorative "EN" pill + theme toggle + notification bell + avatar.
///
/// Simplifications: no language/locale feature exists anywhere in the app
/// (checked `lib/features/**`), so "EN" is decorative only, matching the
/// spec's guidance not to half-build a real i18n feature. The theme toggle
/// is likewise decorative -- the app currently follows `ThemeMode.system`
/// with no manual override plumbed through `main.dart`, and wiring a real
/// app-wide theme switch is out of scope for a dashboard-only redesign.
class _NavRow extends StatelessWidget {
  final Profile profile;
  const _NavRow({required this.profile});

  @override
  Widget build(BuildContext context) {
    final initial = profile.firstName.isNotEmpty ? profile.firstName[0].toUpperCase() : '?';
    return Row(
      children: [
        ClipRRect(
          borderRadius: BorderRadius.circular(10),
          child: Container(
            width: 36,
            height: 36,
            color: Colors.white,
            padding: const EdgeInsets.all(5),
            child: Image.asset('assets/images/logo.png', fit: BoxFit.contain),
          ),
        ),
        const Spacer(),
        _Pill(child: const Text('EN', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: CottageColors.primary))),
        const SizedBox(width: 8),
        _IconPill(icon: Icons.dark_mode_outlined),
        const SizedBox(width: 4),
        Theme(
          data: Theme.of(context).copyWith(
            iconTheme: const IconThemeData(color: CottageColors.primaryForeground),
          ),
          child: const NotificationBell(),
        ),
        const SizedBox(width: 4),
        CircleAvatar(
          radius: 16,
          backgroundColor: Colors.white,
          backgroundImage: profile.avatarUrl != null && profile.avatarUrl!.isNotEmpty
              ? NetworkImage(profile.avatarUrl!)
              : null,
          child: profile.avatarUrl == null || profile.avatarUrl!.isEmpty
              ? Text(initial, style: const TextStyle(color: CottageColors.primary, fontWeight: FontWeight.w700, fontSize: 13))
              : null,
        ),
      ],
    );
  }
}

class _Pill extends StatelessWidget {
  final Widget child;
  const _Pill({required this.child});

  @override
  Widget build(BuildContext context) {
    return Container(
      height: 32,
      padding: const EdgeInsets.symmetric(horizontal: 12),
      alignment: Alignment.center,
      decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(999)),
      child: child,
    );
  }
}

class _IconPill extends StatelessWidget {
  final IconData icon;
  const _IconPill({required this.icon});

  @override
  Widget build(BuildContext context) {
    return Container(
      width: 32,
      height: 32,
      decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(999)),
      child: Icon(icon, size: 16, color: CottageColors.primary),
    );
  }
}
