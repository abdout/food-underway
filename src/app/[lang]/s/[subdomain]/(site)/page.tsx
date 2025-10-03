import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getMerchantBySubdomain } from '@/components/platform/dashboard/actions';
import SiteContent from '@/components/site/content';
import { getCurrentDomain } from '@/components/site/utils';
import { generateMerchantMetadata, generateDefaultMetadata } from '@/components/site/metadata';

interface SiteProps {
  params: Promise<{ subdomain: string }>;
}

export async function generateMetadata({ params }: SiteProps): Promise<Metadata> {
  const { subdomain } = await params;
  const result = await getMerchantBySubdomain(subdomain);
  const { rootDomain } = await getCurrentDomain();

  if (!result.success || !result.data) {
    return generateDefaultMetadata(rootDomain);
  }

  return generateSchoolMetadata({
    merchant: result.data,
    subdomain,
    rootDomain
  });
}

export default async function Site({ params }: SiteProps) {
  const { subdomain } = await params;
  const result = await getSchoolBySubdomain(subdomain);

  if (!result.success || !result.data) {
    notFound();
  }

  const merchant = result.data;

  return (
   
      <div className="merchant-content" data-merchant-id={merchant.id} data-subdomain={subdomain}>
        <SiteContent school={merchant} />
      </div>
   
  );
}