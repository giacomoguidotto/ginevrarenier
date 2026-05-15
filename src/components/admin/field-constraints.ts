export function isNewlineInput(inputType: string): boolean {
  return inputType === "insertParagraph" || inputType === "insertLineBreak";
}

interface ConstraintOptions {
  currentText?: string;
  maxLines?: number;
  multiline?: boolean;
}

export function shouldPreventInput(
  inputType: string,
  options: ConstraintOptions
): boolean {
  const effectiveMultiline =
    options.multiline || (options.maxLines != null && options.maxLines > 1);

  if (!effectiveMultiline && isNewlineInput(inputType)) {
    return true;
  }

  if (
    options.maxLines != null &&
    isNewlineInput(inputType) &&
    options.currentText != null
  ) {
    const newlineCount = (options.currentText.match(/\n/g) ?? []).length;
    if (newlineCount >= options.maxLines - 1) {
      return true;
    }
  }

  return false;
}

interface Dimensions {
  scrollHeight: number;
  scrollWidth: number;
}

interface ThresholdLimits {
  maxHeight?: number;
  maxWidth?: number;
}

export function exceedsThreshold(
  dimensions: Dimensions,
  limits: ThresholdLimits
): boolean {
  if (limits.maxHeight != null && dimensions.scrollHeight > limits.maxHeight) {
    return true;
  }
  if (limits.maxWidth != null && dimensions.scrollWidth > limits.maxWidth) {
    return true;
  }
  return false;
}
