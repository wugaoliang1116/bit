import { generateNodeModulesPattern } from './generate-node-modules-pattern';

describe('generateNodeModulesPattern()', () => {
  describe('should work with empty array', () => {
    it('include any package in the node_modules', () => {
      expect(generateNodeModulesPattern({ packages: [] })).toEqual('node_modules/(?!()/)');
    });
  });
  describe('should work with one package', () => {
    let pattern;
    let regex;
    beforeAll(() => {
      pattern = generateNodeModulesPattern({ packages: ['@myorg'] });
      regex = new RegExp(pattern);
    });

    describe('should exclude the package', () => {
      it('should have yarn structure excluded', () => {
        expect(regex.test('node_modules/@myorg/something')).toBeFalsy();
      });
      it('should have new pnpm structure with + excluded', () => {
        expect(regex.test('node_modules/.pnpm/registry.npmjs.org+@myorg+something/')).toBeFalsy();
      });
      it('should have new pnpm structure excluded', () => {
        expect(regex.test('node_modules/.pnpm/@myorg+something/')).toBeFalsy();
      });
    });
  });
  describe('should work with more than one packages', () => {
    let packagesToTransform;
    let pattern;
    let regex;
    beforeAll(() => {
      packagesToTransform = ['react', '@myorg', 'testing-library__dom'];
      pattern = generateNodeModulesPattern({ packages: packagesToTransform });
      regex = new RegExp(pattern);
    });

    describe('should exclude the first package', () => {
      it('should have yarn structure excluded', () => {
        expect(regex.test('node_modules/react/something')).toBeFalsy();
      });
      it('should have new pnpm structure with + excluded', () => {
        expect(regex.test('node_modules/.pnpm/registry.npmjs.org+react/something')).toBeFalsy();
      });
      it('should have new pnpm structure excluded', () => {
        expect(regex.test('node_modules/.pnpm/react/something')).toBeFalsy();
      });
    });
    describe('should exclude the second package', () => {
      it('should have yarn structure excluded', () => {
        expect(regex.test('node_modules/@myorg/something')).toBeFalsy();
      });
      it('should have new pnpm structure with + excluded', () => {
        expect(regex.test('node_modules/.pnpm/registry.npmjs.org+@myorg+something/')).toBeFalsy();
      });
      it('should have new pnpm structure excluded', () => {
        expect(regex.test('node_modules/.pnpm/@myorg+something/')).toBeFalsy();
      });
    });
    describe('should exclude the third package', () => {
      it('should have yarn structure excluded', () => {
        expect(regex.test('node_modules/testing-library__dom/something')).toBeFalsy();
      });
      it('should have new pnpm structure with + excluded', () => {
        expect(regex.test('node_modules/.pnpm/registry.npmjs.org+testing-library__dom/something')).toBeFalsy();
      });
      it('should have new pnpm structure excluded', () => {
        expect(regex.test('node_modules/.pnpm/testing-library__dom/something')).toBeFalsy();
      });
    });
  });
  describe('should not exclude the package when is not in the regex', () => {
    let packagesToTransform;
    let pattern;
    let regex;
    beforeAll(() => {
      packagesToTransform = ['react'];
      pattern = generateNodeModulesPattern({ packages: packagesToTransform });
      regex = new RegExp(pattern);
    });

    describe('should not exclude', () => {
      it('with yarn structure', () => {
        expect(regex.test('node_modules/not-excluded-package/some-path')).toBeTruthy();
      });
      it('with old pnpm structure', () => {
        expect(regex.test('node_modules/.pnpm/registry.npmjs.org/not-excluded-package/some-path')).toBeTruthy();
      });
      it("with new pnpm structure with '+'", () => {
        expect(regex.test('node_modules/.pnpm/registry.npmjs.org+not-excluded-package/some-path')).toBeTruthy();
      });
      it('with old pnpm structure, different registry name', () => {
        expect(
          regex.test('node_modules/.pnpm/registry.artifactory.something/not-excluded-package/some-path')
        ).toBeTruthy();
      });
      it("with new pnpm structure with '+'", () => {
        expect(
          regex.test('node_modules/.pnpm/registry.artifactory.something+not-excluded-package/some-path')
        ).toBeTruthy();
      });
      it('with new pnpm structure', () => {
        expect(regex.test('node_modules/.pnpm/not-excluded-package/some-path')).toBeTruthy();
      });
    });
  });
  describe('should exclude components', () => {
    let pattern;
    let regex;
    beforeAll(() => {
      pattern = generateNodeModulesPattern({ excludeComponents: true });
      regex = new RegExp(pattern);
    });
    const fixtures = [
      [true, 'not-a-component'],
      [true, '@myorg/not-a-component'],
      [true, 'scope.comp-name'],
      [false, '@myorg/scope.comp-name'],
      [false, '@myorg/scope.namespace.comp-name'],
      [false, '@myorg/scope.ns1.ns2.comp-name'],
    ];
    // @ts-ignore
    it.each(fixtures)(`should return %s for %s in yarn node_modules`, (expectedResult: boolean, pkgName: string) => {
      expect(regex.test(`node_modules/${pkgName}/`)).toEqual(expectedResult);
    });
    // @ts-ignore
    it.each(fixtures)(`should return %s for %s in pnpm node_modules`, (expectedResult: boolean, pkgName: string) => {
      expect(regex.test(`node_modules/.pnpm/${pkgName.replace(/\//g, '+')}/`)).toEqual(expectedResult);
      expect(regex.test(`node_modules/.pnpm/registry.npmjs.org+${pkgName.replace(/\//g, '+')}/`)).toEqual(
        expectedResult
      );
    });
  });
  describe('should exclude components and listed packages', () => {
    let pattern;
    let regex;
    beforeAll(() => {
      pattern = generateNodeModulesPattern({ packages: ['@myorg'], excludeComponents: true });
      regex = new RegExp(pattern);
    });
    it('should have yarn structure excluded', () => {
      expect(regex.test('node_modules/@myorg/something')).toBeFalsy();
    });
  });
  describe('should work with packages under the .pnpm directory', () => {
    let pattern;
    let regex;
    beforeAll(() => {
      pattern = generateNodeModulesPattern({ packages: ['@shohamgilad'], excludeComponents: false });
      regex = new RegExp(pattern);
    });
    it('should exclude package under the .pnpm directory', () => {
      expect(
        regex.test(
          'node_modules/.pnpm/file+shohamgilad.test-new-env_ui_button@0.0.27_react@18.2.0/node_modules/@shohamgilad/test-new-env.ui.button/dist/index.js'
        )
      ).toBeFalsy();
    });
  });
  describe('should work with components under the .pnpm directory', () => {
    let pattern;
    let regex;
    beforeAll(() => {
      pattern = generateNodeModulesPattern({ excludeComponents: true });
      regex = new RegExp(pattern);
    });
    it('should exclude package under the .pnpm directory', () => {
      expect(
        regex.test(
          'node_modules/.pnpm/file+shohamgilad.test-new-env_ui_button@0.0.27_react@18.2.0/node_modules/@shohamgilad/test-new-env.ui.button/dist/index.js'
        )
      ).toBeFalsy();
    });
  });
});
