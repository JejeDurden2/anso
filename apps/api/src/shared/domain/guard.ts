export interface GuardResult {
  succeeded: boolean;
  message?: string;
}

export interface GuardArgument {
  argument: unknown;
  argumentName: string;
}

export class Guard {
  public static combine(guardResults: GuardResult[]): GuardResult {
    for (const result of guardResults) {
      if (!result.succeeded) return result;
    }

    return { succeeded: true };
  }

  public static againstNullOrUndefined(
    argument: unknown,
    argumentName: string
  ): GuardResult {
    if (argument === null || argument === undefined) {
      return {
        succeeded: false,
        message: `${argumentName} is null or undefined`,
      };
    }
    return { succeeded: true };
  }

  public static againstNullOrUndefinedBulk(
    args: GuardArgument[]
  ): GuardResult {
    for (const arg of args) {
      const result = this.againstNullOrUndefined(arg.argument, arg.argumentName);
      if (!result.succeeded) return result;
    }

    return { succeeded: true };
  }

  public static isOneOf(
    value: unknown,
    validValues: unknown[],
    argumentName: string
  ): GuardResult {
    let isValid = false;
    for (const validValue of validValues) {
      if (value === validValue) {
        isValid = true;
        break;
      }
    }

    if (!isValid) {
      return {
        succeeded: false,
        message: `${argumentName} isn't one of the valid values: ${validValues.join(', ')}`,
      };
    }
    return { succeeded: true };
  }

  public static inRange(
    num: number,
    min: number,
    max: number,
    argumentName: string
  ): GuardResult {
    if (num < min || num > max) {
      return {
        succeeded: false,
        message: `${argumentName} is not within range ${min} to ${max}`,
      };
    }
    return { succeeded: true };
  }

  public static againstEmptyString(
    argument: string,
    argumentName: string
  ): GuardResult {
    if (argument.trim().length === 0) {
      return {
        succeeded: false,
        message: `${argumentName} is empty`,
      };
    }
    return { succeeded: true };
  }

  public static isValidEmail(email: string, argumentName: string): GuardResult {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return {
        succeeded: false,
        message: `${argumentName} is not a valid email`,
      };
    }
    return { succeeded: true };
  }
}
