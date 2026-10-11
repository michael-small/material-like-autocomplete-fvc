'use strict';

const ts = require('typescript');

const formControlTypeNames = new Set([
  'AbstractControl',
  'FormArray',
  'FormControl',
  'FormGroup',
  'FormRecord',
  'SignalFormControl',
]);

module.exports = {
  meta: {
    type: 'problem',
    docs: {
      description:
        'Disallow reading values directly from Angular form controls',
    },
    messages: {
      noFormValue:
        'Read form values through fieldTree() or FormEventData instead.',
    },
    schema: [],
  },
  create(context) {
    const { esTreeNodeToTSNodeMap, program } =
      context.sourceCode.parserServices;

    if (!program || !esTreeNodeToTSNodeMap) {
      throw new Error(
        'no-form-control-value-access requires TypeScript type information.'
      );
    }

    const checker = program.getTypeChecker();

    function isFormControlType(type, visited = new Set()) {
      if (!type || visited.has(type)) {
        return false;
      }
      visited.add(type);

      if (type.isUnionOrIntersection()) {
        return type.types.some(member => isFormControlType(member, visited));
      }

      const symbol = type.aliasSymbol || type.getSymbol();
      if (symbol && formControlTypeNames.has(symbol.getName())) {
        return true;
      }

      if (
        type.flags & ts.TypeFlags.Object &&
        symbol &&
        symbol.declarations?.some(
          declaration =>
            ts.isClassDeclaration(declaration) ||
            ts.isInterfaceDeclaration(declaration)
        )
      ) {
        return checker
          .getBaseTypes(type)
          .some(baseType => isFormControlType(baseType, visited));
      }

      return false;
    }

    function reportIfFormControl(member) {
      const object = esTreeNodeToTSNodeMap.get(member.object);
      const type = checker.getTypeAtLocation(object);

      if (isFormControlType(type)) {
        context.report({
          node: member.property,
          messageId: 'noFormValue',
        });
      }
    }

    function getPropertyName(member) {
      if (!member.computed && member.property.type === 'Identifier') {
        return member.property.name;
      }
      if (
        member.computed &&
        member.property.type === 'Literal' &&
        typeof member.property.value === 'string'
      ) {
        return member.property.value;
      }
      return undefined;
    }

    return {
      MemberExpression(node) {
        if (getPropertyName(node) === 'value') {
          reportIfFormControl(node);
        }
      },
      CallExpression(node) {
        const callee = node.callee;
        if (
          callee.type === 'MemberExpression' &&
          getPropertyName(callee) === 'getRawValue'
        ) {
          reportIfFormControl(callee);
        }
      },
    };
  },
};
