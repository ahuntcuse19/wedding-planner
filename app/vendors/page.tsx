"use client";

import CrudList from "@/components/CrudList";
import { PageTitle } from "@/components/primitives";

export default function VendorsPage() {
  return (
    <div>
      <PageTitle title="Vendors" subtitle="Who you're talking to and where things stand." />
      <CrudList slug="vendors" />
    </div>
  );
}
