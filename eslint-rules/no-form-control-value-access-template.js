'use strict';

function unwrapExpression(expression) {
  return expression?.type === 'ASTWithSource' ? expression.ast : expression;
}

function getRootName(expression) {
  const current = unwrapExpression(expression);
  if (!current) {
    return undefined;
  }

  if (
    (current.type === 'PropertyRead' ||
      current.type === 'SafePropertyRead') &&
    current.receiver?.type === 'ImplicitReceiver'
  ) {
    return current.name;
  }

  if (
    current.type === 'PropertyRead' ||
    current.type === 'SafePropertyRead' ||
    current.type === 'Call' ||
    current.type === 'SafeCall' ||
    current.type === 'KeyedRead' ||
    current.type === 'SafeKeyedRead'
  ) {
    return getRootName(current.receiver);
  }

  return undefined;
}

function hasPropertyInChain(expression, propertyName) {
  const current = unwrapExpression(expression);
  if (!current) {
    return false;
  }

  if (
    (current.type === 'PropertyRead' ||
      current.type === 'SafePropertyRead') &&
    current.name === propertyName
  ) {
    return true;
  }

  if (
    current.type === 'PropertyRead' ||
    current.type === 'SafePropertyRead' ||
    current.type === 'Call' ||
    current.type === 'SafeCall' ||
    current.type === 'KeyedRead' ||
    current.type === 'SafeKeyedRead'
  ) {
    return hasPropertyInChain(current.receiver, propertyName);
  }

  return false;
}

module.exports = {
  meta: {
    type: 'problem',
    docs: {
      description:
        'Disallow reading values directly from form controls in Angular templates',
    },
    messages: {
      noFormValue:
        'Read form values through fieldTree() or FormEventData instead.',
    },
    schema: [],
  },
  create(context) {
    const formRoots = new Set();

    function isFormRoot(expression) {
      return formRoots.has(getRootName(expression));
    }

    function report(node) {
      context.report({
        node,
        messageId: 'noFormValue',
      });
    }

    return {
      BoundAttribute(node) {
        if (node.name === 'formGroup') {
          const rootName = getRootName(node.value);
          if (rootName) {
            formRoots.add(rootName);
          }
        }
      },
      LetDeclaration(node) {
        if (formRoots.has(getRootName(node.value))) {
          formRoots.add(node.name);
        }
      },
      PropertyRead(node) {
        if (
          node.name === 'value' &&
          isFormRoot(node.receiver) &&
          !hasPropertyInChain(node.receiver, 'fieldTree')
        ) {
          report(node);
        }
      },
      SafePropertyRead(node) {
        if (
          node.name === 'value' &&
          isFormRoot(node.receiver) &&
          !hasPropertyInChain(node.receiver, 'fieldTree')
        ) {
          report(node);
        }
      },
      Call(node) {
        const callee = unwrapExpression(node.receiver);
        if (
          (callee?.type === 'PropertyRead' ||
            callee?.type === 'SafePropertyRead') &&
          callee.name === 'getRawValue' &&
          isFormRoot(callee.receiver)
        ) {
          report(node);
        }
      },
      SafeCall(node) {
        const callee = unwrapExpression(node.receiver);
        if (
          (callee?.type === 'PropertyRead' ||
            callee?.type === 'SafePropertyRead') &&
          callee.name === 'getRawValue' &&
          isFormRoot(callee.receiver)
        ) {
          report(node);
        }
      },
    };
  },
};
