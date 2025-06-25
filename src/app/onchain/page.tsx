import OnchainScreener from '@/components/OnchainScreener';

export const metadata = {
  title: 'Onchain Activity Screener',
  description: 'Monitor suspicious token accumulation by fresh wallets',
};

export default function OnchainPage() {
  console.log('Rendering Onchain Page');
  return (
    <main className="container mx-auto px-4 py-8">
      <OnchainScreener />
    </main>
  );
} 