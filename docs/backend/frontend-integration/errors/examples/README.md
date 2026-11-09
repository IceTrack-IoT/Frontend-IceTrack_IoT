# Error body examples

Bodies of the standard `ErrorResource` (`{code, message, details?}`). Codes and message templates come from `ErrorResponseAssembler`, `GlobalExceptionHandler`, `messages.properties`. The shapes and the texts of `not-found`, `address-out-of-coverage` (message), `validation` and `forbidden` match responses captured from a locally running backend; `message` is always present and `details` is omitted when null. Full contract: [../error-contract.md](../error-contract.md).
