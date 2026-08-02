import 'package:flutter/material.dart';
import '../theme/theme.dart';

/// Opens a themed modal bottom sheet with the Cottage design language.
///
/// The sheet has a drag handle, rounded top corners, and uses the theme's
/// card color. The [builder] receives the sheet's [BuildContext] so
/// downstream widgets can still use `context.surface`.
Future<T?> showCottageSheet<T>({
  required BuildContext context,
  required WidgetBuilder builder,
  bool isScrollControlled = true,
  bool useSafeArea = true,
}) {
  final surface = context.surface;
  return showModalBottomSheet<T>(
    context: context,
    isScrollControlled: isScrollControlled,
    useSafeArea: useSafeArea,
    backgroundColor: surface.card,
    shape: const RoundedRectangleBorder(
      borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
    ),
    builder: (ctx) {
      return Padding(
        padding: EdgeInsets.only(
          bottom: MediaQuery.viewInsetsOf(ctx).bottom,
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const SizedBox(height: 12),
            Container(
              width: 36,
              height: 4,
              decoration: BoxDecoration(
                color: surface.muted,
                borderRadius: BorderRadius.circular(2),
              ),
            ),
            const SizedBox(height: 8),
            builder(ctx),
          ],
        ),
      );
    },
  );
}

/// A titled bottom sheet with consistent header styling.
class CottageSheetContent extends StatelessWidget {
  final String title;
  final List<Widget> children;
  final EdgeInsetsGeometry padding;

  const CottageSheetContent({
    super.key,
    required this.title,
    required this.children,
    this.padding = const EdgeInsets.fromLTRB(20, 8, 20, 24),
  });

  @override
  Widget build(BuildContext context) {
    final surface = context.surface;
    return Padding(
      padding: padding,
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Text(
            title,
            style: TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.w700,
              color: surface.foreground,
            ),
          ),
          const SizedBox(height: 16),
          ...children,
        ],
      ),
    );
  }
}
