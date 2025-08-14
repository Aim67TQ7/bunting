import { PageLayout } from "@/components/page-layout";

const Dashboard = () => {
  return (
    <PageLayout title="Dashboard">
      <iframe
        src="https://dashboard.buntinggpt.com"
        className="w-full h-full border-0"
        title="Dashboard"
        sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-downloads"
        allow="accelerometer; autoplay; camera; clipboard-read; clipboard-write; display-capture; encrypted-media; fullscreen; geolocation; gyroscope; magnetometer; microphone; midi; payment; picture-in-picture; publickey-credentials-get; screen-wake-lock; web-share"
      />
    </PageLayout>
  );
};

export default Dashboard;