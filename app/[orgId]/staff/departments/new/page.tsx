"use client";

import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useCreateDepartment } from "@/hooks/use-departments";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft } from "lucide-react";

const schema = z.object({
  name: z.string().min(1, "Name is required"),
  code: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

export default function NewDepartmentPage() {
  const params = useParams();
  const router = useRouter();
  const orgId = params?.orgId as string;

  const createDept = useCreateDepartment(orgId);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: "", code: "" },
  });

  const onSubmit = (values: FormValues) => {
    createDept.mutate(
      { name: values.name.trim(), code: values.code?.trim() || null },
      {
        onSuccess: () => router.push(`/${orgId}/staff/departments`),
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
              <Link href={`/${orgId}/staff/departments`} className="gap-1.5">
                <ArrowLeft className="size-4" />
              </Link>
            </Button>
            <h1 className="text-md font-semibold tracking-tight">New department</h1>
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
              placeholder="e.g. Sales"
              className={errors.name ? "border-destructive" : ""}
            />
            {errors.name && (
              <p className="text-xs text-destructive">{errors.name.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="code">Code (optional)</Label>
            <Input
              id="code"
              {...register("code")}
              placeholder="e.g. SAL"
            />
          </div>
          <div className="flex gap-2 pt-2">
            <Button type="submit" disabled={createDept.isPending}>
              Create
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push(`/${orgId}/staff/departments`)}
            >
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
