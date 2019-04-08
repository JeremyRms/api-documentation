import {PolymerElement} from '../../@polymer/polymer/polymer-element.js';
import {html} from '../../@polymer/polymer/lib/utils/html-tag.js';
import '../../@polymer/polymer/lib/elements/dom-if.js';
import '../../@api-components/raml-aware/raml-aware.js';
import '../../@api-components/api-endpoint-documentation/api-endpoint-documentation.js';
import '../../@api-components/api-type-documentation/api-type-documentation.js';
import '../../@api-components/api-documentation-document/api-documentation-document.js';
import '../../@api-components/api-method-documentation/api-method-documentation.js';
import '../../@api-components/api-summary/api-summary.js';
import '../../@api-components/api-security-documentation/api-security-documentation.js';
import {AmfHelperMixin} from '../../@api-components/amf-helper-mixin/amf-helper-mixin.js';
/* eslint-disable max-len */
/**
 * `api-documentation`
 *
 * A main documentation view for AMF model.
 *
 * This element works with [AMF](https://github.com/mulesoft/amf) data model.
 *
 * It works well with `api-navigation` component. When `handle-navigation-events`
 * is set it listens for selection events dispatched by the navigation.
 *
 * To manually steare the behavior of the component you have to set both:
 * - selected
 * - selectedType
 *
 * Selected is an `@id` of the AMF data model in json/ld representation.
 * Selected type tells the component where to look for the data and which
 * view to render.
 *
 * The component handles data computation on selection change.
 *
 * ## Updating API's base URI
 *
 * By default the component render the documentation as it is defined
 * in the AMF model. Sometimes, however, you may need to replace the base URI
 * of the API with something else. It is useful when the API does not
 * have base URI property defined (therefore this component render relative
 * paths instead of URIs) or when you want to manage different environments.
 *
 * To update base URI value either update `baseUri` property or use
 * `iron-meta` with key `ApiBaseUri`. First method is easier but the second
 * gives much more flexibility since it use a
 * [monostate pattern](http://wiki.c2.com/?MonostatePattern)
 * to manage base URI property.
 *
 * When the component constructs the funal URI for the endpoint it does the following:
 * - if `baseUri` is set it uses this value as a base uri for the endpoint
 * - else if `iron-meta` with key `ApiBaseUri` exists and contains a value
 * it uses it uses this value as a base uri for the endpoint
 * - else if `amfModel` is set then it computes base uri value from main
 * model document
 * Then it concatenates computed base URI with `endpoint`'s path property.
 *
 * ### Example
 *
 * ```html
 * <iron-meta key="ApiBaseUri" value="https://domain.com"></iron-meta>
 * ```
 *
 * To update value of the `iron-meta`:
 * ```javascript
 * new Polymer.IronMeta({key: 'ApiBaseUri'}).value = 'https://other.domain';
 * ```
 *
 * Note: The element will not be notified about the change when `iron-meta` value change.
 * The change will be reflected when `amfModel` or `endpoint` property chnage.
 *
 * ## Styling
 *
 * `<api-documentation>` provides the following custom properties and mixins for styling:
 *
 * Custom property | Description | Default
 * ----------------|-------------|----------
 * `--api-documentation` | Mixin applied to this elment | `{}`
 *
 * @customElement
 * @polymer
 * @demo demo/index.html
 * @memberof ApiElements
 * @appliesMixin AmfHelperMixin
 */
class ApiDocumentation extends AmfHelperMixin(PolymerElement) {
  static get template() {
    return html`
    <style>
    :host {
      display: block;
      @apply --api-documentation;
    }
    </style>
    <template is="dom-if" if="[[aware]]">
      <raml-aware raml="{{amfModel}}" scope="[[aware]]"></raml-aware>
    </template>
    <template is="dom-if" if="[[isSummary]]" restamp="true">
      <api-summary amf-model="[[amfModel]]" base-uri="[[baseUri]]"></api-summary>
    </template>
    <template is="dom-if" if="[[isSecurity]]" restamp="true">
      <api-security-documentation amf-model="{{amfModel}}" security="[[_computeSecurity(declares, selected, amfModel, _isFragment)]]" narrow="[[narrow]]"></api-security-documentation>
    </template>
    <template is="dom-if" if="[[_renderInlineEndpoint(inlineMethods, isMethod, isEndpoint)]]" restamp="true">
      <api-endpoint-documentation amf-model="{{amfModel}}" endpoint="[[endpoint]]" previous="[[_computeEndpointPrevious(webApi, selected)]]" next="[[_computeEndpointNext(webApi, selected)]]" base-uri="[[baseUri]]" narrow="[[narrow]]" selected="[[selected]]" no-try-it="" inline-methods="" scroll-target="[[scrollTarget]]" redirect-uri="[[redirectUri]]"></api-endpoint-documentation>
    </template>
    <template is="dom-if" if="[[_renderEndpoint(inlineMethods, isEndpoint)]]" restamp="true">
      <api-endpoint-documentation amf-model="{{amfModel}}" endpoint="[[endpoint]]" previous="[[_computeEndpointPrevious(webApi, selected)]]" next="[[_computeEndpointNext(webApi, selected)]]" base-uri="[[baseUri]]" narrow="[[narrow]]" inline-methods="[[inlineMethods]]" scroll-target="[[scrollTarget]]" redirect-uri="[[redirectUri]]"></api-endpoint-documentation>
    </template>
    <template is="dom-if" if="[[_renderMethod(inlineMethods, isMethod)]]" restamp="true">
      <api-method-documentation amf-model="{{amfModel}}" endpoint="[[endpoint]]" method="[[_computeMethodModel(webApi, selected)]]" previous="[[_computeMethodPrevious(webApi, selected)]]" next="[[_computeMethodNext(webApi, selected)]]" base-uri="[[baseUri]]" no-try-it="[[noTryIt]]" narrow="[[narrow]]" render-security="" render-code-snippets=""></api-method-documentation>
    </template>
    <template is="dom-if" if="[[isDoc]]" restamp="true">
      <api-documentation-document amf-model="{{amfModel}}" api-document="[[_computeDocuemntationModel(webApi, selected, amfModel, _isFragment)]]"></api-documentation-document>
    </template>
    <template is="dom-if" if="[[isType]]" restamp="true">
      <api-type-documentation amf-model="{{amfModel}}" type="[[_computeTypeModel(declares, references, selected, amfModel, _isFragment)]]" narrow="[[narrow]]"></api-type-documentation>
    </template>
`;
  }

  static get is() {
    return 'api-documentation';
  }
  static get properties() {
    return {
      /**
       * `raml-aware` scope property to use.
       */
      aware: String,
      /**
       * A model's `@id` of selected documentation part.
       * Special case is for `summary` view. It's not part of an API
       * but most applications has some kind of summary view for the
       * API.
       */
      selected: String,
      /**
       * Type of the selected item.
       * One of `documentation`, `type`, `security`, `endpoint`, `method`
       * or `summary`.
       */
      selectedType: String,
      _isFragment: {
        type: Boolean,
        computed: '_computeIsFragment(amfModel)'
      },
      /**
       * By default application hosting the element must set `selected` and
       * `selectedType` properties. When using `api-navigation` element
       * by setting this property the element listens for navigation events
       * and updates the state
       */
      handleNavigationEvents: {
        type: Boolean,
        observer: '_handleNavChanged'
      },
      // True if currently selection is endpoint
      isEndpoint: {
        type: Boolean,
        readOnly: true
      },
      // True if currently selection is method
      isMethod: {
        type: Boolean,
        readOnly: true
      },
      // True if currently selection is documentation
      isDoc: {
        type: Boolean,
        readOnly: true
      },
      // True if currently selection is type
      isType: {
        type: Boolean,
        readOnly: true
      },
      // True if currently selection is security
      isSecurity: {
        type: Boolean,
        readOnly: true
      },
      // True if currently selection is summary
      isSummary: {
        type: Boolean,
        readOnly: true
      },
      /**
       * Computed value of AMF model of a type of `http://schema.org/WebAPI`
       *
       * @type {Object}
       */
      webApi: {
        type: Object,
        computed: '_computeWebApi(amfModel)'
      },
      /**
       * Computed value of `declares` part of the AMF model
       *
       * @type {Array<Object>}
       */
      declares: {
        type: Array,
        computed: '_computeDeclares(amfModel)'
      },
      /**
       * Computed value of `references` part of the AMF model
       *
       * @type {Array<Object>}
       */
      references: {
        type: Array,
        computed: '_computeReferences(amfModel)'
      },
      /**
       * A property to set to override AMF's model base URI information.
       */
      baseUri: String,
      /**
       * Passing value of `noTryIt` to the method documentation.
       * Hiddes "Try it" button.
       */
      noTryIt: Boolean,
      /**
       * If set it will renders the view in the narrow layout.
       */
      narrow: Boolean,
      /**
       * If set then it renders methods documentation inline with
       * the endpoint documentation.
       * When it's not set (or value is `false`, default) then it renders
       * just a list of methods with links.
       */
      inlineMethods: {type: Boolean, value: false},
      /**
       * Scroll target used to observe `scroll` event.
       * When set the element will observe scroll and inform other components
       * about changes in navigation while scrolling through methods list.
       * The navigation event contains `passive: true` property that
       * determines that it's not user triggered navigation but rather
       * context enforced.
       */
      scrollTarget: Object,
      /**
       * OAuth2 redirect URI.
       * This value **must** be set in order for OAuth 1/2 to work properly.
       * This is only required in inline mode (`inlineMethods`).
       */
      redirectUri: String,
      /**
       * Computed value of currently rendered endpoint.
       */
      endpoint: {type: Object, readOnly: true}
    };
  }

  static get observers() {
    return [
      '_navigationOccured(selectedType)',
      '_updateEndpoint(isEndpoint,isMethod,selected,webApi)'
    ];
  }

  constructor() {
    super();
    this._navigationHandler = this._navigationHandler.bind(this);
  }

  disconnectedCallback() {
    if (this.__eventsRegistered) {
      this._unregisterNavigationEvents();
    }
  }
  /**
   * Registers `api-navigation-selection-changed` event listener handler
   * on window object.
   */
  _registerNavigationEvents() {
    this.__eventsRegistered = true;
    window.addEventListener('api-navigation-selection-changed', this._navigationHandler);
  }
  /**
   * Removes event listener from window object for
   * `api-navigation-selection-changed` event.
   */
  _unregisterNavigationEvents() {
    this.__eventsRegistered = false;
    window.removeEventListener('api-navigation-selection-changed', this._navigationHandler);
  }
  /**
   * Registers / unregisters event listeners depending on `state`
   *
   * @param {Boolean} state
   */
  _handleNavChanged(state) {
    if (state) {
      this._registerNavigationEvents();
    } else {
      this._unregisterNavigationEvents();
    }
  }
  /**
   * Handler for `api-navigation-selection-changed` event.
   *
   * @param {CustomEvent} e
   */
  _navigationHandler(e) {
    if (e.detail.passive === true) {
      return;
    }
    this.selected = e.detail.selected;
    this.selectedType = e.detail.type;
  }
  /**
   * Handles navigation change, computes model for the view and finally
   * renders the view.
   * @param {String} selectedType
   */
  _navigationOccured(selectedType) {
    const isEndpoint = selectedType === 'endpoint';
    if (this.isEndpoint !== isEndpoint) {
      this._setIsEndpoint(isEndpoint);
    }
    const isMethod = selectedType === 'method';
    if (this.isMethod !== isMethod) {
      this._setIsMethod(isMethod);
    }
    const isDoc = selectedType === 'documentation';
    if (this.isDoc !== isDoc) {
      this._setIsDoc(isDoc);
    }
    const isType = selectedType === 'type';
    if (this.isType !== isType) {
      this._setIsType(isType);
    }
    const isSecurity = selectedType === 'security';
    if (this.isSecurity !== isSecurity) {
      this._setIsSecurity(isSecurity);
    }
    const isSummary = selectedType === 'summary';
    if (this.isSummary !== isSummary) {
      this._setIsSummary(isSummary);
    }
  }
  /**
   * Creates a link model that is accepted by the endpoint documentation
   * view.
   * @param {?Object} item An AMF shape to use to get the data from.
   * @return {Object|undefined} Object with `label` and `id` or `undefined`
   * if no item.
   */
  _computeEndpointLink(item) {
    if (!item) {
      return;
    }
    let name = this._getValue(item, this.ns.schema.schemaName);
    if (!name) {
      name = this._getValue(item, this.ns.raml.vocabularies.http + 'path');
    }
    return {
      id: item['@id'],
      label: name
    };
  }
  /**
   * Computes link model for previous endpoint, if any exists relative to
   * current selection.
   * @param {Object} webApi WebApi shape object of AMF
   * @param {String} selected Currently selected endpoint
   * @return {Object|undefined} Object with `label` and `id` or `undefined`
   * if no previous item.
   */
  _computeEndpointPrevious(webApi, selected) {
    if (!webApi || !selected) {
      return;
    }
    const ekey = this._getAmfKey(this.ns.raml.vocabularies.http + 'endpoint');
    const endpoints = this._ensureArray(webApi[ekey]);
    if (!endpoints) {
      return;
    }
    for (let i = 0; i < endpoints.length; i++) {
      if (endpoints[i]['@id'] === selected) {
        return this._computeEndpointLink(endpoints[i - 1]);
      }
    }
  }
  /**
   * Computes link model for next endpoint, if any exists relative to
   * current selection.
   * @param {Object} webApi WebApi shape object of AMF
   * @param {String} selected Currently selected endpoint
   * @return {Object|undefined} Object with `label` and `id` or `undefined`
   * if no next item.
   */
  _computeEndpointNext(webApi, selected) {
    if (!webApi || !selected) {
      return;
    }
    const ekey = this._getAmfKey(this.ns.raml.vocabularies.http + 'endpoint');
    const endpoints = this._ensureArray(webApi[ekey]);
    if (!endpoints) {
      return;
    }
    for (let i = 0; i < endpoints.length; i++) {
      if (endpoints[i]['@id'] === selected) {
        return this._computeEndpointLink(endpoints[i + 1]);
      }
    }
  }
  /**
   * Creates a link model that is accepted by the method documentation
   * view.
   * @param {?Object} item An AMF shape to use to get the data from.
   * @return {Object|undefined} Object with `label` and `id` or `undefined`
   * if no item.
   */
  _computeMethodLink(item) {
    if (!item) {
      return;
    }
    let name = this._getValue(item, this.ns.schema.schemaName);
    if (!name) {
      name = this._getValue(item, this.ns.w3.hydra.core + 'method');
    }
    return {
      id: item['@id'],
      label: name
    };
  }
  /**
   * Computes link for the previous method.
   * This is used by the method documentation panel to render previous
   * nethod link.
   * @param {Object} webApi WebApi shape object of AMF
   * @param {String} selected Currently selected method
   * @return {Object|undefined} Object with `label` and `id` or `undefined`
   * if no previous item.
   */
  _computeMethodPrevious(webApi, selected) {
    const methods = this.__computeMethodsListForMethod(webApi, selected);
    if (!methods) {
      return;
    }
    for (let i = 0; i < methods.length; i++) {
      if (methods[i]['@id'] === selected) {
        return this._computeMethodLink(methods[i - 1]);
      }
    }
  }
  /**
   * Computes link for the next method.
   * This is used by the method documentation panel to render next
   * nethod link.
   * @param {Object} webApi WebApi shape object of AMF
   * @param {String} selected Currently selected method
   * @return {Object|undefined} Object with `label` and `id` or `undefined`
   * if no next item.
   */
  _computeMethodNext(webApi, selected) {
    const methods = this.__computeMethodsListForMethod(webApi, selected);
    if (!methods) {
      return;
    }
    for (let i = 0; i < methods.length; i++) {
      if (methods[i]['@id'] === selected) {
        return this._computeMethodLink(methods[i + 1]);
      }
    }
  }
  /**
   * A method to update value of the `endpoint` property when needed.
   * This function is to reduce number of updates of `endpoint` property
   * when rendering endpoint documentation in inline mode. In this case each
   * change to the endpoint trigges heavy computations.
   *
   * @param {Boolean} isEndpoint
   * @param {Boolean} isMethod
   * @param {String} selected
   * @param {Object} webApi
   */
  _updateEndpoint(isEndpoint, isMethod, selected, webApi) {
    if (!selected || !webApi) {
      return;
    }
    if (!isEndpoint && !isMethod) {
      return;
    }
    // Do not clean up "endpoint" property as it will trigger change
    // observers. If the view is hidden it doesn't matter
    let endpoint;
    if (isEndpoint) {
      endpoint = this._computeEndpointModel(webApi, selected);
    } else {
      endpoint = this._computeMethodEndpoint(webApi, selected);
    }
    const current = this.endpoint;
    // This is designed to trigger as less changes as possible.
    if (current === endpoint) {
      return;
    }
    if (!current) {
      if (endpoint) {
        this._setEndpoint(endpoint);
      }
    } else {
      if (!endpoint) {
        this._setEndpoint(endpoint);
      } else if (current['@id'] !== endpoint['@id']) {
        this._setEndpoint(endpoint);
      }
    }
  }
  /**
   * Tests if endpoint component should be rendered for both method and
   * endpoint documentation in inline mode.
   * @param {Boolean} inlineMethods
   * @param {Boolean} isMethod
   * @param {Boolean} isEndpoint
   * @return {Boolean}
   */
  _renderInlineEndpoint(inlineMethods, isMethod, isEndpoint) {
    if (!inlineMethods) {
      return false;
    }
    return !!(isMethod || isEndpoint);
  }
  /**
   * Computes if single endpoint doc should be rendered
   * @param {Boolean} inlineMethods
   * @param {Boolean} isEndpoint
   * @return {Boolean}
   */
  _renderEndpoint(inlineMethods, isEndpoint) {
    return !!(!inlineMethods && isEndpoint);
  }
  /**
   * Computes if single method doc should be rendered
   * @param {Boolean} inlineMethods
   * @param {Boolean} isMethod
   * @return {Boolean}
   */
  _renderMethod(inlineMethods, isMethod) {
    return !!(!inlineMethods && isMethod);
  }

  _computeIsFragment(model) {
    if (model instanceof Array) {
      model = model[0];
    }
    return !this._hasType(model, this.ns.raml.vocabularies.document + 'Document');
  }
  /**
   * Tests if `model` is of a RAML library model.
   * @param {Object|Array} model A shape to test
   * @return {Boolean}
   */
  _isLibrary(model) {
    if (!model) {
      return false;
    }
    if (model instanceof Array) {
      model = model[0];
    }
    const moduleKey = this._getAmfKey(this.ns.raml.vocabularies.document + 'Module');
    return moduleKey === model['@type'][0];
  }
  /**
   * Computes security scheme model.
   * @param {Object} declares Computed value of `declares`
   * @param {String} selected Current selection
   * @param {Object|Array} model Passed AMF model.
   * @param {Boolean} isFragment Value of `_isFragment` property
   * @return {Object|undefined}
   */
  _computeSecurity(declares, selected, model, isFragment) {
    if (!isFragment) {
      return this._computeSecurityModel(declares, selected);
    }
    if (this._isLibrary(model)) {
      return this._computeDeclById(model, selected);
    }
    return this._computeEncodes(model);
  }
  /**
   * Computes model for documentation.
   * @param {Object} webApi Computed value of webApi
   * @param {String} selected Current selection
   * @param {Object|Array} model Passed AMF model.
   * @param {Boolean} isFragment Value of `_isFragment` property
   * @return {Object|undefined}
   */
  _computeDocuemntationModel(webApi, selected, model, isFragment) {
    if (!isFragment) {
      return this._computeDocument(webApi, selected);
    }
    return this._computeEncodes(model);
  }
  /**
   * Computes model for a type.
   * @param {Array<Object>} declares Computed list of declares
   * @param {Array<Object>} references Computed list of references
   * @param {String} selected Current selection
   * @param {Object|Array} model Passed AMF model.
   * @param {Boolean} isFragment Value of `_isFragment` property
   * @return {Object|undefined}
   */
  _computeTypeModel(declares, references, selected, model, isFragment) {
    if (!isFragment) {
      return this._computeType(declares, references, selected);
    }
    if (this._isLibrary(model)) {
      return this._computeDeclById(model, selected);
    }
    return this._computeEncodes(model);
  }
  /**
   * Computes model of a shape defined ni `declares` list
   * @param {Object} model AMF model
   * @param {String} selected Current selection
   * @return {Object|undefined}
   */
  _computeDeclById(model, selected) {
    const declares = this._computeDeclares(model);
    if (!declares) {
      return;
    }
    return declares.find((item) => item['@id'] === selected);
  }
}
window.customElements.define(ApiDocumentation.is, ApiDocumentation);
