import { Injectable } from '@nestjs/common';
import { trace, Span, SpanStatusCode, Tracer, context } from '@opentelemetry/api';

@Injectable()
export class TracingService {
  private readonly tracer: Tracer;

  constructor() {
    this.tracer = trace.getTracer('anso-api');
  }

  /**
   * Start a new span for tracking an operation
   */
  startSpan(name: string, attributes?: Record<string, string | number | boolean>): Span {
    return this.tracer.startSpan(name, { attributes });
  }

  /**
   * Get the current active span
   */
  getActiveSpan(): Span | undefined {
    return trace.getActiveSpan();
  }

  /**
   * Add attributes to the current span
   */
  addAttributes(attributes: Record<string, string | number | boolean>): void {
    const span = this.getActiveSpan();
    if (span) {
      span.setAttributes(attributes);
    }
  }

  /**
   * Record an error on the current span
   */
  recordError(error: Error): void {
    const span = this.getActiveSpan();
    if (span) {
      span.recordException(error);
      span.setStatus({ code: SpanStatusCode.ERROR, message: error.message });
    }
  }

  /**
   * End a span with success status
   */
  endSpanSuccess(span: Span): void {
    span.setStatus({ code: SpanStatusCode.OK });
    span.end();
  }

  /**
   * End a span with error status
   */
  endSpanError(span: Span, error: Error): void {
    span.recordException(error);
    span.setStatus({ code: SpanStatusCode.ERROR, message: error.message });
    span.end();
  }

  /**
   * Execute a function within a new span
   */
  async withSpan<T>(
    name: string,
    fn: (span: Span) => Promise<T>,
    attributes?: Record<string, string | number | boolean>
  ): Promise<T> {
    const span = this.startSpan(name, attributes);

    try {
      const result = await context.with(trace.setSpan(context.active(), span), () => fn(span));
      this.endSpanSuccess(span);
      return result;
    } catch (error) {
      this.endSpanError(span, error instanceof Error ? error : new Error(String(error)));
      throw error;
    }
  }

  /**
   * Execute a sync function within a new span
   */
  withSpanSync<T>(
    name: string,
    fn: (span: Span) => T,
    attributes?: Record<string, string | number | boolean>
  ): T {
    const span = this.startSpan(name, attributes);

    try {
      const result = context.with(trace.setSpan(context.active(), span), () => fn(span));
      this.endSpanSuccess(span);
      return result;
    } catch (error) {
      this.endSpanError(span, error instanceof Error ? error : new Error(String(error)));
      throw error;
    }
  }
}
