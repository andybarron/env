# Changelog

## 0.2.0

- Add `default` method allowing default values for optional environment
  variables
- Add `variable` method so environment variable names can be different from
  output object keys
- Add `boolean` parser
- Add `description` method to override descriptions of existing `Parser`
  instances
- Show which variables are optional in `EnvironmentVariableParseError` summary
- Internal refactor of `Parser` type and construction

## 0.1.0

- Add support for custom parsers
- Make `parse` async to support async custom parsers
- Add doc comments :tada:
- Add typecheck step to CI

## 0.0.3

- Add CHANGELOG
- Add CI workflows for linting, formatting, and testing
- Add publishing workflow
- Script changes for publishing via CI instead of locally
- Add fancy badges :sunglasses:

## 0.0.2

- Add `port` parser
- Make parser functions chain errors more consistently
- Sort failures by environment variable name in `EnvironmentVariableParseError`
  error message
- Add tests
- Add README

## 0.0.1

- Initial release
