import React from 'react';

export type AlertEvent = {
  kind: string;
  entry?: any;
};

export function useAlerts(onAlert: (ev: AlertEvent) => void) {
  React.useEffect(() => {
    const es = new EventSource('/api/alerts/stream');
    es.onmessage = (ev) => {
      try {
        const data = JSON.parse(ev.data);
        onAlert(data);
      } catch {}
    };
    return () => es.close();
  }, [onAlert]);
}
