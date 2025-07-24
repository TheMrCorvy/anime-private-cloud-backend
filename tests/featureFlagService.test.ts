import { FeatureNames, isFeatureFlagEnabled } from '../src/services/featureFlagService';

describe('featureFlagService', () => {
    afterEach(() => {
        delete process.env.FEATURE_FLAGS;
    });

    describe('getFeatureFlags & isFeatureFlagEnabled', () => {
        it('should return null if FEATURE_FLAGS env is not set', () => {
            delete process.env.FEATURE_FLAGS;
            expect(isFeatureFlagEnabled(FeatureNames.SERVE_MOCK_DATA)).toBe(false);
        });

        it('should return false if feature flag is not present', () => {
            process.env.FEATURE_FLAGS = JSON.stringify([{ enabled: true, feature: FeatureNames.CONSUME_STRAPI_DATA }]);
            expect(isFeatureFlagEnabled(FeatureNames.SERVE_MOCK_DATA)).toBe(false);
        });

        it('should return true if feature flag is enabled', () => {
            process.env.FEATURE_FLAGS = JSON.stringify([{ enabled: true, feature: FeatureNames.SERVE_MOCK_DATA }]);
            expect(isFeatureFlagEnabled(FeatureNames.SERVE_MOCK_DATA)).toBe(true);
        });

        it('should return false if feature flag is disabled', () => {
            process.env.FEATURE_FLAGS = JSON.stringify([{ enabled: false, feature: FeatureNames.SERVE_MOCK_DATA }]);
            expect(isFeatureFlagEnabled(FeatureNames.SERVE_MOCK_DATA)).toBe(false);
        });

        it('should handle multiple feature flags correctly', () => {
            process.env.FEATURE_FLAGS = JSON.stringify([
                { enabled: false, feature: FeatureNames.SERVE_MOCK_DATA },
                { enabled: true, feature: FeatureNames.CONSUME_STRAPI_DATA },
            ]);
            expect(isFeatureFlagEnabled(FeatureNames.SERVE_MOCK_DATA)).toBe(false);
            expect(isFeatureFlagEnabled(FeatureNames.CONSUME_STRAPI_DATA)).toBe(true);
        });
    });
});
