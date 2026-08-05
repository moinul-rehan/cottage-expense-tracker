import 'package:flutter/material.dart';
import '../../../core/models/profile.dart';
import '../../../core/theme/theme.dart';
import '../../../core/utils/format_month.dart';
import '../../../main.dart';
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
class _NavRow extends StatefulWidget {
  final Profile profile;
  const _NavRow({required this.profile});

  @override
  State<_NavRow> createState() => _NavRowState();
}

class _NavRowState extends State<_NavRow> {
  String _selectedLang = 'EN';

  void _showLanguagePicker() {
    showModalBottomSheet(
      context: context,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (ctx) => Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Select Language',
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.bold,
                color: Theme.of(context).textTheme.bodyLarge?.color,
              ),
            ),
            const SizedBox(height: 16),
            ListTile(
              leading: const Icon(Icons.language, color: CottageColors.primary),
              title: const Text('English (EN)'),
              trailing: _selectedLang == 'EN'
                  ? const Icon(Icons.check_circle, color: CottageColors.primary)
                  : null,
              onTap: () {
                setState(() => _selectedLang = 'EN');
                Navigator.pop(ctx);
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(content: Text('Language set to English')),
                );
              },
            ),
            ListTile(
              leading: const Icon(Icons.language, color: CottageColors.primary),
              title: const Text('Bengali (BN)'),
              trailing: _selectedLang == 'BN'
                  ? const Icon(Icons.check_circle, color: CottageColors.primary)
                  : null,
              onTap: () {
                setState(() => _selectedLang = 'BN');
                Navigator.pop(ctx);
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(content: Text('Language set to Bengali')),
                );
              },
            ),
          ],
        ),
      ),
    );
  }

  void _toggleTheme() {
    final current = themeModeNotifier.value;
    final isDark = current == ThemeMode.dark ||
        (current == ThemeMode.system &&
            MediaQuery.of(context).platformBrightness == Brightness.dark);

    themeModeNotifier.value = isDark ? ThemeMode.light : ThemeMode.dark;
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(isDark ? 'Switched to Light Theme' : 'Switched to Dark Theme'),
        duration: const Duration(seconds: 1),
      ),
    );
  }

  void _openProfile() {
    showModalBottomSheet(
      context: context,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (ctx) => Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                CircleAvatar(
                  radius: 24,
                  backgroundColor: CottageColors.primary,
                  backgroundImage: widget.profile.avatarUrl != null &&
                          widget.profile.avatarUrl!.isNotEmpty
                      ? NetworkImage(widget.profile.avatarUrl!)
                      : null,
                  child: widget.profile.avatarUrl == null ||
                          widget.profile.avatarUrl!.isEmpty
                      ? Text(
                          widget.profile.firstName.isNotEmpty
                              ? widget.profile.firstName[0].toUpperCase()
                              : '?',
                          style: const TextStyle(
                            color: Colors.white,
                            fontWeight: FontWeight.bold,
                            fontSize: 20,
                          ),
                        )
                      : null,
                ),
                const SizedBox(width: 14),
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      widget.profile.displayName,
                      style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                    ),
                    Text(
                      widget.profile.isSuperAdmin ? 'Super Admin' : 'Cottage Member',
                      style: const TextStyle(color: Colors.grey, fontSize: 13),
                    ),
                  ],
                ),
              ],
            ),
            const SizedBox(height: 16),
            const Divider(),
            ListTile(
              leading: const Icon(Icons.person_outline),
              title: const Text('Full Name'),
              subtitle: Text('${widget.profile.firstName} ${widget.profile.lastName}'),
            ),
            ListTile(
              leading: const Icon(Icons.star_outline),
              title: const Text('Role'),
              subtitle: Text(widget.profile.isSuperAdmin ? 'Super Admin' : 'Member'),
            ),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final initial = widget.profile.firstName.isNotEmpty
        ? widget.profile.firstName[0].toUpperCase()
        : '?';

    return ValueListenableBuilder<ThemeMode>(
      valueListenable: themeModeNotifier,
      builder: (context, mode, _) {
        final isDark = mode == ThemeMode.dark ||
            (mode == ThemeMode.system &&
                MediaQuery.of(context).platformBrightness == Brightness.dark);

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
            _Pill(
              onTap: _showLanguagePicker,
              child: Text(
                _selectedLang,
                style: const TextStyle(
                  fontSize: 12,
                  fontWeight: FontWeight.w600,
                  color: CottageColors.primary,
                ),
              ),
            ),
            const SizedBox(width: 8),
            _IconPill(
              onTap: _toggleTheme,
              icon: isDark ? Icons.light_mode_outlined : Icons.dark_mode_outlined,
            ),
            const SizedBox(width: 4),
            Theme(
              data: Theme.of(context).copyWith(
                iconTheme: const IconThemeData(color: CottageColors.primaryForeground),
              ),
              child: const NotificationBell(),
            ),
            const SizedBox(width: 4),
            GestureDetector(
              onTap: _openProfile,
              child: CircleAvatar(
                radius: 16,
                backgroundColor: Colors.white,
                backgroundImage: widget.profile.avatarUrl != null &&
                        widget.profile.avatarUrl!.isNotEmpty
                    ? NetworkImage(widget.profile.avatarUrl!)
                    : null,
                child: widget.profile.avatarUrl == null ||
                        widget.profile.avatarUrl!.isEmpty
                    ? Text(
                        initial,
                        style: const TextStyle(
                          color: CottageColors.primary,
                          fontWeight: FontWeight.w700,
                          fontSize: 13,
                        ),
                      )
                    : null,
              ),
            ),
          ],
        );
      },
    );
  }
}

class _Pill extends StatelessWidget {
  final Widget child;
  final VoidCallback? onTap;
  const _Pill({required this.child, this.onTap});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        height: 32,
        padding: const EdgeInsets.symmetric(horizontal: 12),
        alignment: Alignment.center,
        decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(999)),
        child: child,
      ),
    );
  }
}

class _IconPill extends StatelessWidget {
  final IconData icon;
  final VoidCallback? onTap;
  const _IconPill({required this.icon, this.onTap});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        width: 32,
        height: 32,
        decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(999)),
        child: Icon(icon, size: 16, color: CottageColors.primary),
      ),
    );
  }
}
