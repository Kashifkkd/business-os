"use client";

import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useCreateDesignation } from "@/hooks/use-designations";
import { useDepartmentsList } from "@/hooks/use-departments";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft } from "lucide-react";

const schema = z.object({
  name: z.string().min(1, "Name is required"),
  department_id: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

export default function NewDesignationPage() {
  const params = useParams();
  const router = useRouter();
  const orgId = params?.orgId as string;

  const { data: departments = [] } = useDepartmentsList(orgId);
  const createDesig = useCreateDesignation(orgId);
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: "", department_id: "" },
  });

  const departmentId = watch("department_id");

  const onSubmit = (values: FormValues) => {
    createDesig.mutate(
      {
        name: values.name.trim(),
        department_id: values.department_id?.trim() || null,
      },
      {
        onSuccess: () => router.push(`/${orgId}/staff/designations`),
      }
    );
  };

  if (!orgId) return null;

  return (
    <div className="flex h-full w-full min-h-0 flex-col overflow-auto">
      <div className="mx-auto w-full max-w-6xl flex-1 space-y-4 px-2 py-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="sm" asChild>
              <Link href={`/${orgId}/staff/designations`} className="gap-1.5">
                <ArrowLeft className="size-4" />
              </Link>
            </Button>
            <h1 className="text-md font-semibold tracking-tight">New designation</h1>
          </div>
        </div>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="flex max-w-md flex-col gap-4 rounded-lg border bg-card p-4"
        >
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              {...register("name")}
              placeholder="e.g. Manager"
              className={errors.name ? "border-destructive" : ""}
            />
            {errors.name && (
              <p className="text-xs text-destructive">{errors.name.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label>Department (optional)</Label>
            <Select
              value={departmentId || "none"}
              onValueChange={(v) => setValue("department_id", v === "none" ? "" : v)}
            >
              <SelectTrigger>
                <SelectValue placeholder="All departments" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">— All departments —</SelectItem>
                {departments.map((d) => (
                  <SelectItem key={d.id} value={d.id}>
                    {d.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex gap-2 pt-2">
            <Button type="submit" disabled={createDesig.isPending}>
              Create
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push(`/${orgId}/staff/designations`)}
            >
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
