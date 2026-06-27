/**
 * Redraw rules — gentle guidance, never a hard block.
 * The goal is to slow the user down, not gate them out.
 */

export interface RedrawPromptCopy {
  /** The line Hint says before they redraw. */
  gentle: string;
  /** Label of the action that completes the redraw. */
  confirmLabel: string;
  /** Label of the action that cancels and stays with the current reading. */
  declineLabel: string;
  /** True when the prior reading count is high enough to deserve stronger language. */
  isDiscouraging: boolean;
}

type Translate = (key: string) => string;

/**
 * Given the number of redraws *already done* in this session,
 * return the copy for the confirmation prompt.
 */
export function getRedrawPromptCopy(priorRedraws: number, t: Translate): RedrawPromptCopy {
  if (priorRedraws >= 2) {
    return {
      gentle: t("reading.redraw.third.body"),
      confirmLabel: t("reading.redraw.third.confirm"),
      declineLabel: t("reading.redraw.third.decline"),
      isDiscouraging: true,
    };
  }
  if (priorRedraws >= 1) {
    return {
      gentle: t("reading.redraw.second.body"),
      confirmLabel: t("reading.redraw.second.confirm"),
      declineLabel: t("reading.redraw.second.decline"),
      isDiscouraging: false,
    };
  }
  return {
    gentle: t("reading.redraw.first.body"),
    confirmLabel: t("reading.redraw.first.confirm"),
    declineLabel: t("reading.redraw.first.decline"),
    isDiscouraging: false,
  };
}
