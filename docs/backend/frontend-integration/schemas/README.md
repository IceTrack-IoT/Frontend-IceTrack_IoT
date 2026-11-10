# JSON Schemas

One draft 2020-12 schema per REST resource record, grouped by bounded context: `schemas/<context>/<Resource>.schema.json`. Each schema carries an `x-source` property with the repository path of the Java record it was derived from. Nested records are referenced with a relative `$ref` (`Nested.schema.json`, same folder). Enumerations are inlined as `enum`.

Derived from Bean Validation annotations (`@NotNull`, `@NotBlank`, `@Size`, `@DecimalMin/Max`, `@Min/Max`, `@Positive`, `@Email`, `@Pattern`) and the `@Schema` annotations. Cross-field rules (for example `min_temperature <= avg_temperature <= max_temperature`, calibration offsets) are not expressible here; they are described in the context `contracts.md` and in [../bounded-contexts/monitoring.md](../bounded-contexts/monitoring.md). Property names are the serialized `snake_case` names.

Contexts: `iam`, `profiles`, `assets`, `device`, `monitoring`, `notifications`, `reporting`, `service-request`. Examples live next to the endpoint catalog in `api/<context>/requests|responses|nested`. Error body examples: [../errors/examples/](../errors/examples/).
