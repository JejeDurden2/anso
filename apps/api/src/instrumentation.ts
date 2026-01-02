import { NodeSDK } from '@opentelemetry/sdk-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { resourceFromAttributes } from '@opentelemetry/resources';
import {
  ATTR_SERVICE_NAME,
  ATTR_SERVICE_VERSION,
} from '@opentelemetry/semantic-conventions';
import { HttpInstrumentation } from '@opentelemetry/instrumentation-http';
import { ExpressInstrumentation } from '@opentelemetry/instrumentation-express';
import { NestInstrumentation } from '@opentelemetry/instrumentation-nestjs-core';
import { PrismaInstrumentation } from '@prisma/instrumentation';

// Only enable OpenTelemetry if OTEL_EXPORTER_OTLP_ENDPOINT is set
const otlpEndpoint = process.env.OTEL_EXPORTER_OTLP_ENDPOINT;

export function initializeTracing(): NodeSDK | null {
  if (!otlpEndpoint) {
    console.log('📊 OpenTelemetry disabled (OTEL_EXPORTER_OTLP_ENDPOINT not set)');
    return null;
  }

  const traceExporter = new OTLPTraceExporter({
    url: `${otlpEndpoint}/v1/traces`,
    headers: process.env.OTEL_EXPORTER_OTLP_HEADERS
      ? JSON.parse(process.env.OTEL_EXPORTER_OTLP_HEADERS)
      : {},
  });

  const sdk = new NodeSDK({
    resource: resourceFromAttributes({
      [ATTR_SERVICE_NAME]: process.env.OTEL_SERVICE_NAME || 'anso-api',
      [ATTR_SERVICE_VERSION]: process.env.npm_package_version || '0.1.0',
      'deployment.environment': process.env.NODE_ENV || 'development',
    }),
    traceExporter,
    instrumentations: [
      // HTTP instrumentation (incoming and outgoing requests)
      new HttpInstrumentation({
        ignoreIncomingRequestHook: (request) => {
          // Ignore health checks and static assets
          const url = request.url || '';
          return url.includes('/health') || url.includes('/favicon');
        },
      }),
      // Express instrumentation (routes, middleware)
      new ExpressInstrumentation(),
      // NestJS instrumentation (controllers, providers)
      new NestInstrumentation(),
      // Prisma instrumentation (database queries)
      new PrismaInstrumentation(),
    ],
  });

  // Start the SDK
  sdk.start();

  console.log(`📊 OpenTelemetry initialized (exporting to ${otlpEndpoint})`);

  // Graceful shutdown
  process.on('SIGTERM', () => {
    sdk
      .shutdown()
      .then(() => console.log('📊 OpenTelemetry shut down'))
      .catch((error) => console.error('📊 OpenTelemetry shutdown error:', error))
      .finally(() => process.exit(0));
  });

  return sdk;
}
