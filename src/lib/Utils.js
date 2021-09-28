import { ns } from '@api-components/amf-helper-mixin';

/** @typedef {import('@api-components/amf-helper-mixin').ApiShapeUnion} ApiShapeUnion */
/** @typedef {import('@api-components/amf-helper-mixin').ApiScalarShape} ApiScalarShape */
/** @typedef {import('@api-components/amf-helper-mixin').ApiArrayShape} ApiArrayShape */
/** @typedef {import('@api-components/amf-helper-mixin').ApiUnionShape} ApiUnionShape */
/** @typedef {import('@api-components/amf-helper-mixin').ApiParameter} ApiParameter */
/** @typedef {import('@api-components/amf-helper-mixin').ApiPropertyShape} ApiPropertyShape */
/** @typedef {import('@api-components/amf-helper-mixin').ApiNodeShape} ApiNodeShape */
/** @typedef {import('../types').OperationParameter} OperationParameter */

/**
 * @param {string} value The value from the graph model to use to read the value from
 */
export function schemaToType(value) {
  const typed = String(value);
  let index = typed.lastIndexOf('#');
  if (index === -1) {
    index = typed.lastIndexOf('/');
  }
  let v = typed.substr(index + 1);
  if (v) {
    v = `${v[0].toUpperCase()}${v.substr(1)}`
  }
  return v;
}

/**
 * Reads the label for a data type for a shape union.
 * @param {ApiShapeUnion} schema
 * @param {boolean=} [isArray] Used internally
 * @returns {string|undefined} Computed label for a shape.
 */
export function readPropertyTypeLabel(schema, isArray=false) {
  if (!schema) {
    return undefined;
  }
  const { types } = schema;
  if (types.includes(ns.aml.vocabularies.shapes.ScalarShape)) {
    const scalar = /** @type ApiScalarShape */ (schema);
    return schemaToType(scalar.dataType || '');
  }
  if (types.includes(ns.aml.vocabularies.shapes.ArrayShape)) {
    const array = /** @type ApiArrayShape */ (schema);
    if (!array.items) {
      return undefined;
    }
    const label = readPropertyTypeLabel(array.items, true);
    return `List of ${label}`;
  }
  if (types.includes(ns.w3.shacl.NodeShape)) {
    let { name } = /** @type ApiNodeShape */ (schema);
    const { properties } = /** @type ApiNodeShape */ (schema);
    if (isArray && properties && properties.length === 1) {
      const potentialScalar = /** @type ApiScalarShape */ (properties[0].range);
      if (potentialScalar.types.includes(ns.aml.vocabularies.shapes.ScalarShape)) {
        return schemaToType(potentialScalar.dataType || '');
      }
    }
    if (name === 'type') {
      // AMF seems to put `type` value into a property that is declared inline (?).
      name = undefined;
    }
    return name || 'Object';
  }
  if (types.includes(ns.aml.vocabularies.shapes.UnionShape)) {
    const union = /** @type ApiUnionShape */ (schema);
    const items = union.anyOf.map(i => readPropertyTypeLabel(i));
    return items.join(' or ');
  }
  if (types.includes(ns.aml.vocabularies.shapes.FileShape)) {
    return 'File';
  }
  return 'Unknown';
}