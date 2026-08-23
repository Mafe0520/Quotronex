import { CustomerForm } from '@/components/app/customers/CustomerForm';

export const metadata = { title: 'New Customer — Quotronex' };

export default function NewCustomerPage() {
  return <CustomerForm mode="create" />;
}
