export function isNewlineInput(inputType: string): boolean {
  return inputType === "insertParagraph" || inputType === "insertLineBreak";
}

interface ConstraintOptions {
  multiline?: boolean;
}

export function shouldPreventInput(
  inputType: string,
  options: ConstraintOptions
): boolean {
  if (!options.multiline && isNewlineInput(inputType)) {
    return true;
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
