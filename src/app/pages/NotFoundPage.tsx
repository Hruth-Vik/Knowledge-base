import { ArrowLink } from '../ui/ArrowLink.js';
import { FeaturePlaceholder } from '../ui/FeaturePlaceholder.js';

export function NotFoundPage() {
  return (
    <FeaturePlaceholder
      action={
        <>
          <ArrowLink to="/">Return to Today</ArrowLink>
          <ArrowLink to="/java">Open the Java roadmap</ArrowLink>
        </>
      }
      deck="The address does not match a route in this notebook."
      kicker="404 / Not found"
      stage="No matching route"
      statusTitle="This page is not in the notebook."
      title="Page not found"
    >
      <p>
        The link may be older than the content, or the address may contain a
        typo. Nothing is hidden behind a redirect.
      </p>
    </FeaturePlaceholder>
  );
}
