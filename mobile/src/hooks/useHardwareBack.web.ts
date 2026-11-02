export function useHardwareBack(handler: () => boolean) {
  // Browsers have no Android hardware-back event. Keeping this as a platform-specific no-op
  // allows the exact native component tree to be rendered by the parity capture harness.
  void handler;
}
