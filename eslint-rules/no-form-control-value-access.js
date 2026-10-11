'use strict';

const ts = require('typescript');

module.exports = {
  meta: {
    type: 'problem',
    docs: {
      description:
        'Disallow reading values directly from signal-backed Angular forms',
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

    function hasSignalFormControl(type, visited = new Set()) {
      if (!type || type.flags & ts.TypeFlags.Any || visited.has(type)) {
        return false;
      }
      visited.add(type);

      if (type.isUnionOrIntersection()) {
        return type.types.some(member =>
          hasSignalFormControl(member, visited)
        );
      }

      const symbol = type.getSymbol();
      const typeSymbols = [symbol, type.aliasSymbol].filter(Boolean);
      if (
        typeSymbols.some(
          typeSymbol => typeSymbol.getName() === 'SignalFormControl'
        )
      ) {
        return true;
      }

      if (
        typeSymbols.some(typeSymbol =>
          ['FormGroup', 'FormRecord'].includes(typeSymbol.getName())
        )
      ) {
        const controlsType =
          type.flags & ts.TypeFlags.Object &&
          type.objectFlags & ts.ObjectFlags.Reference
            ? checker.getTypeArguments(type)[0]
            : undefined;

        return (
          controlsType?.getProperties().some(property => {
            const declaration =
              property.valueDeclaration || property.declarations?.[0];
            return (
              declaration &&
              hasSignalFormControl(
                checker.getTypeOfSymbolAtLocation(property, declaration),
                visited
              )
            );
          }) ?? false
        );
      }

      if (
        typeSymbols.some(typeSymbol => typeSymbol.getName() === 'FormArray')
      ) {
        const controlType =
          type.flags & ts.TypeFlags.Object &&
          type.objectFlags & ts.ObjectFlags.Reference
            ? checker.getTypeArguments(type)[0]
            : undefined;
        return controlType
          ? hasSignalFormControl(controlType, visited)
          : false;
      }

      return false;
    }

    function reportIfFormControl(member) {
      const object = esTreeNodeToTSNodeMap.get(member.object);
      const type = checker.getTypeAtLocation(object);

      if (hasSignalFormControl(type)) {
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
