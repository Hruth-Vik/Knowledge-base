import { isRouteErrorResponse, useRouteError } from 'react-router-dom';
import { ArrowLink } from './ui/ArrowLink.js';
import { FeaturePlaceholder } from './ui/FeaturePlaceholder.js';

export function RouteErrorPage() {
  const error = useRouteError();
  let message = 'The page could not be rendered.';

  if (isRouteErrorResponse(error)) {
    message = `${error.status} ${error.statusText}`.trim();
  } else if (error instanceof Error) {
    message = error.message;
  }

  return (
    <FeaturePlaceholder
      action={<ArrowLink to="/">Return to Today</ArrowLink>}
      deck="A route failed before it could finish. The stored notebook was not replaced."
      kicker="Application error"
      stage="Route error"
      statusTitle="The page stopped before it could finish."
      title="Page failed"
    >
      <p>{message}</p>
      <p>
        Reload the page. If the failure returns, open Today, then export the
        notebook from Settings before making further changes.
      </p>
    </FeaturePlaceholder>
  );
}
