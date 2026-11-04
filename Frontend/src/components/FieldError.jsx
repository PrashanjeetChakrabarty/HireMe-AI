// A short red message under a form field. It shows nothing when there is no error.
export default function FieldError({ message }) {
  if (!message) {
    return null;
  }
  return (
    <p className="field-error" role="alert">
      {message}
    </p>
  );
}
