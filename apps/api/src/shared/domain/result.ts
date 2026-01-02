export class Result<T> {
  public readonly isSuccess: boolean;
  public readonly isFailure: boolean;
  public readonly error: string | null;
  private readonly _value: T | null;

  private constructor(isSuccess: boolean, error: string | null, value: T | null) {
    this.isSuccess = isSuccess;
    this.isFailure = !isSuccess;
    this.error = error;
    this._value = value;

    Object.freeze(this);
  }

  public get value(): T {
    if (!this.isSuccess || this._value === null) {
      throw new Error('Cannot get the value of a failed result');
    }
    return this._value;
  }

  public static ok<U>(value: U): Result<U> {
    return new Result<U>(true, null, value);
  }

  public static fail<U>(error: string): Result<U> {
    return new Result<U>(false, error, null);
  }

  public static combine(results: Result<unknown>[]): Result<void> {
    for (const result of results) {
      if (result.isFailure) {
        return Result.fail<void>(result.error!);
      }
    }
    return Result.ok<void>(undefined as void);
  }
}
