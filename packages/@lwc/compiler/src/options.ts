/*
 * Copyright (c) 2018, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: MIT
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/MIT
 */
import { InstrumentationObject, CompilerValidationErrors, invariant } from '@lwc/errors';
import { isUndefined, isBoolean, isObject } from '@lwc/shared';
import { CustomRendererConfig } from '@lwc/template-compiler';

type RecursiveRequired<T> = {
    [P in keyof T]-?: RecursiveRequired<T[P]>;
};

const DEFAULT_OPTIONS = {
    isExplicitImport: false,
    preserveHtmlComments: false,
    enableStaticContentOptimization: true,
    // TODO [#3370]: remove experimental template expression flag
    experimentalComplexExpressions: false,
    disableSyntheticShadowSupport: false,
    enableLightningWebSecurityTransforms: false,
};

const DEFAULT_DYNAMIC_IMPORT_CONFIG: Required<DynamicImportConfig> = {
    loader: '',
    strictSpecifier: true,
};

const DEFAULT_STYLESHEET_CONFIG: RecursiveRequired<StylesheetConfig> = {
    customProperties: {
        resolution: { type: 'native' },
    },
};

const DEFAULT_OUTPUT_CONFIG: Required<OutputConfig> = {
    minify: false,
    sourcemap: false,
};

export type CustomPropertiesResolution = { type: 'native' } | { type: 'module'; name: string };

export interface StylesheetConfig {
    customProperties?: {
        resolution?: CustomPropertiesResolution;
    };
}

export interface OutputConfig {
    /**
     * If `true` a source map is generated for the transformed file.
     * @default false
     */
    sourcemap?: boolean;

    /**
     * @deprecated The minify property has no effect on the generated output.
     */
    minify?: boolean;
}

export interface DynamicImportConfig {
    loader?: string;
    strictSpecifier?: boolean;
}

export interface TransformOptions {
    name?: string;
    namespace?: string;
    stylesheetConfig?: StylesheetConfig;
    // TODO [#3331]: deprecate / rename this compiler option in 246
    /* Config applied in usage of dynamic import statements in javascript */
    experimentalDynamicComponent?: DynamicImportConfig;
    /* Flag to enable usage of dynamic component(lwc:dynamic) directive in HTML template */
    experimentalDynamicDirective?: boolean;
    /* Flag to enable usage of dynamic component(lwc:is) directive in HTML template */
    enableDynamicComponents?: boolean;
    // TODO [#3370]: remove experimental template expression flag
    experimentalComplexExpressions?: boolean;
    outputConfig?: OutputConfig;
    isExplicitImport?: boolean;
    preserveHtmlComments?: boolean;
    scopedStyles?: boolean;
    enableStaticContentOptimization?: boolean;
    customRendererConfig?: CustomRendererConfig;
    enableLwcSpread?: boolean;
    disableSyntheticShadowSupport?: boolean;
    enableLightningWebSecurityTransforms?: boolean;
    instrumentation?: InstrumentationObject;
}

type RequiredTransformOptions = Omit<
    TransformOptions,
    | 'name'
    | 'namespace'
    | 'scopedStyles'
    | 'customRendererConfig'
    | 'enableLwcSpread'
    | 'enableLightningWebSecurityTransforms'
    | 'enableDynamicComponents'
    | 'experimentalDynamicDirective'
    | 'experimentalDynamicComponent'
    | 'instrumentation'
>;
export interface NormalizedTransformOptions extends RecursiveRequired<RequiredTransformOptions> {
    name?: string;
    namespace?: string;
    scopedStyles?: boolean;
    customRendererConfig?: CustomRendererConfig;
    enableLwcSpread?: boolean;
    enableLightningWebSecurityTransforms?: boolean;
    enableDynamicComponents?: boolean;
    experimentalDynamicDirective?: boolean;
    experimentalDynamicComponent?: DynamicImportConfig;
    instrumentation?: InstrumentationObject;
}

export function validateTransformOptions(options: TransformOptions): NormalizedTransformOptions {
    validateOptions(options);
    return normalizeOptions(options);
}

function validateOptions(options: TransformOptions) {
    invariant(!isUndefined(options), CompilerValidationErrors.MISSING_OPTIONS_OBJECT, [options]);

    if (!isUndefined(options.stylesheetConfig)) {
        validateStylesheetConfig(options.stylesheetConfig);
    }

    if (!isUndefined(options.outputConfig)) {
        validateOutputConfig(options.outputConfig);
    }
}

function validateStylesheetConfig(config: StylesheetConfig) {
    const { customProperties } = config;

    if (!isUndefined(customProperties)) {
        const { resolution } = customProperties;

        if (!isUndefined(resolution)) {
            invariant(isObject(resolution), CompilerValidationErrors.INVALID_RESOLUTION_PROPERTY, [
                resolution,
            ]);

            const { type } = resolution;
            invariant(
                type === 'native' || type === 'module',
                CompilerValidationErrors.INVALID_TYPE_PROPERTY,
                [type]
            );
        }
    }
}

function isUndefinedOrBoolean(property: any): boolean {
    return isUndefined(property) || isBoolean(property);
}

function validateOutputConfig(config: OutputConfig) {
    invariant(
        isUndefinedOrBoolean(config.sourcemap),
        CompilerValidationErrors.INVALID_SOURCEMAP_PROPERTY,
        [config.sourcemap]
    );

    if (!isUndefined(config.minify)) {
        // eslint-disable-next-line no-console
        console.warn(
            `"OutputConfig.minify" property is deprecated. The value doesn't impact the compilation and can safely be removed.`
        );
    }
}

function normalizeOptions(options: TransformOptions): NormalizedTransformOptions {
    const outputConfig: Required<OutputConfig> = {
        ...DEFAULT_OUTPUT_CONFIG,
        ...options.outputConfig,
    };

    const stylesheetConfig: RecursiveRequired<StylesheetConfig> = {
        customProperties: {
            ...DEFAULT_STYLESHEET_CONFIG.customProperties,
            ...(options.stylesheetConfig && options.stylesheetConfig.customProperties),
        },
    };

    const experimentalDynamicComponent: Required<DynamicImportConfig> = {
        ...DEFAULT_DYNAMIC_IMPORT_CONFIG,
        ...options.experimentalDynamicComponent,
    };

    return {
        ...DEFAULT_OPTIONS,
        ...options,
        stylesheetConfig,
        outputConfig,
        experimentalDynamicComponent,
    };
}
