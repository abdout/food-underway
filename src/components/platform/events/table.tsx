"use client";

import { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/table/data-table/data-table";
import { DataTableToolbar } from "@/components/table/data-table/data-table-toolbar";
import { useDataTable } from "@/components/table/hooks/use-data-table";
import type { EventRow } from "./columns";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useModal } from "@/components/atom/modal/context";
import Modal from "@/components/atom/modal/modal";
import { EventCreateForm } from "@/components/platform/events/form";

export function EventsTable({ data, columns, pageCount }: { data: EventRow[]; columns: ColumnDef<EventRow, unknown>[]; pageCount: number }) {
  const { table } = useDataTable<EventRow>({ data, columns, pageCount });
  const { openModal } = useModal();
  
  return (
    <DataTable table={table}>
      <DataTableToolbar table={table}>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-8 w-8 p-0 rounded-full"
          onClick={() => openModal()}
          aria-label="Create"
          title="Create"
        >
          <Plus className="h-4 w-4" />
        </Button>
      </DataTableToolbar>
      <Modal content={<EventCreateForm />} />
    </DataTable>
  );
}
