import { redirect } from 'next/navigation';

export default function ProductSlugRedirect({ params }: { params: { slug: string } }) {
  redirect(`/products/${params.slug}`);
}
