"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { AutofillTemplate, DEFAULT_AUTOFILL_TEMPLATES } from "@/lib/quizData";
import { evaluateRelationalPermission, recordAuditLog, PermissionUser } from "@/lib/relationalPermissions";

/**
 * Database-first fetcher for Autofill Note Templates.
 * Queries Neon PostgreSQL via Prisma first.
 * Only falls back to hardcoded DEFAULT_AUTOFILL_TEMPLATES inside catch block if DB is unreachable.
 */
export async function fetchAutofillTemplatesFromDbAction(includeArchived: boolean = false): Promise<AutofillTemplate[]> {
  try {
    const dbTemplates = await prisma.autofill_templates.findMany({
      where: includeArchived ? {} : { deleted_at: null },
      orderBy: [{ is_free: "desc" }, { created_at: "desc" }],
      include: {
        autofill_fields: {
          orderBy: { position: "asc" },
          include: { autofill_field_options: { orderBy: { position: "asc" } } },
        },
        autofill_template_versions_autofill_template_versions_template_idToautofill_templates: {
          orderBy: { created_at: "desc" },
          take: 1,
        },
      },
    });

    if (dbTemplates && dbTemplates.length > 0) {
      return dbTemplates.map((t, idx) => {
        const latestVer = t.autofill_template_versions_autofill_template_versions_template_idToautofill_templates[0];
        const matchingDef = DEFAULT_AUTOFILL_TEMPLATES.find((d) => d.name === t.name || d.slug === t.slug);
        
        const isDeleted = t.deleted_at !== null && t.deleted_at !== undefined;
        const status = isDeleted ? "archived" : (t.status === "active" ? "active" : "draft");

        return {
          id: matchingDef?.id ?? idx + 1,
          dbId: t.id,
          name: t.name,
          slug: t.slug,
          description: t.description ?? matchingDef?.description ?? "",
          category: t.category ?? matchingDef?.category ?? "General",
          system: t.category ?? matchingDef?.system ?? "General",
          isFree: t.is_free,
          fields: t.autofill_fields.length > 0 ? t.autofill_fields.length : matchingDef?.fields ?? 0,
          usageCount: 0,
          lastUsed: new Date(t.updated_at).toLocaleDateString("en-AU"),
          status,
          author: "GP Edge Admin",
          version: latestVer?.version_label ?? matchingDef?.version ?? "v1.0",
          subjective: latestVer?.subjective ?? matchingDef?.subjective ?? "",
          objective: latestVer?.objective ?? matchingDef?.objective ?? "",
          assessment: latestVer?.assessment ?? matchingDef?.assessment ?? "",
          plan: latestVer?.plan ?? matchingDef?.plan ?? "",
          doctorSummary: latestVer?.doctor_summary ?? matchingDef?.doctorSummary ?? "",
          patientResources: latestVer?.patient_resources ?? matchingDef?.patientResources ?? "",
          references: latestVer?.references_text ?? matchingDef?.references ?? "",
          followupNotes: latestVer?.followup_notes ?? matchingDef?.followupNotes ?? "",
          sampleFields: t.autofill_fields.length > 0
            ? t.autofill_fields.map((f) => ({
                name: f.name,
                type: (f.field_type as string) === "dropdown" ? "Dropdown" : (f.field_type as string) === "numeric" || (f.field_type as string) === "number" ? "Numeric" : "Text Input",
                required: f.required,
                placeholder: f.placeholder ?? "",
                options: f.autofill_field_options.map((o) => o.value),
              }))
            : matchingDef?.sampleFields ?? [],
        };
      });
    }
  } catch (error) {
    console.error("fetchAutofillTemplatesFromDbAction error, falling back to backup data:", error);
  }
  return DEFAULT_AUTOFILL_TEMPLATES;
}

export async function deleteAutofillTemplateAction(id: string | number, adminUser?: PermissionUser): Promise<{ success: boolean; error?: string }> {
  try {
    const idStr = String(id);
    const existing = await prisma.autofill_templates.findFirst({
      where: { OR: [{ id: idStr }, { name: idStr }, { slug: idStr }] },
      select: { id: true, name: true },
    });

    if (!existing) return { success: false, error: "Template not found" };

    if (adminUser) {
      const permCheck = await evaluateRelationalPermission({
        user: adminUser,
        capability: "archive_item",
        item: { id: existing.id, type: "autofill_template" },
      });
      if (!permCheck.allowed) return { success: false, error: permCheck.reason };
    }

    await prisma.autofill_templates.update({
      where: { id: existing.id },
      data: { deleted_at: new Date(), updated_at: new Date() },
    });

    await recordAuditLog({
      adminUserId: adminUser?.id,
      action: "archive",
      category: "autofill_template",
      entityType: "autofill_template",
      entityId: existing.id,
      metadata: { archivedBy: adminUser?.name || adminUser?.email },
    });

    revalidatePath("/admin/autofill");
    return { success: true };
  } catch (error: any) {
    console.error("deleteAutofillTemplateAction error:", error);
    return { success: false, error: error.message };
  }
}

export async function restoreAutofillTemplateAction(id: string | number, adminUser?: PermissionUser): Promise<{ success: boolean; error?: string }> {
  try {
    const idStr = String(id);
    const existing = await prisma.autofill_templates.findFirst({
      where: { OR: [{ id: idStr }, { name: idStr }, { slug: idStr }] },
      select: { id: true, name: true },
    });

    if (!existing) return { success: false, error: "Template not found" };

    if (adminUser) {
      const permCheck = await evaluateRelationalPermission({
        user: adminUser,
        capability: "restore_item",
        item: { id: existing.id, type: "autofill_template" },
      });
      if (!permCheck.allowed) return { success: false, error: permCheck.reason };
    }

    await prisma.autofill_templates.update({
      where: { id: existing.id },
      data: { deleted_at: null, updated_at: new Date() },
    });

    await recordAuditLog({
      adminUserId: adminUser?.id,
      action: "restore",
      category: "autofill_template",
      entityType: "autofill_template",
      entityId: existing.id,
      metadata: { restoredBy: adminUser?.name || adminUser?.email },
    });

    revalidatePath("/admin/autofill");
    return { success: true };
  } catch (error: any) {
    console.error("restoreAutofillTemplateAction error:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Enforces real database mutation for is_free attribute in Neon PostgreSQL via Prisma.
 * Evaluates relational permissions server-side.
 */
export async function toggleTemplateFreeStatus(
  id: string | number,
  is_free: boolean,
  adminUser?: PermissionUser
): Promise<{ success: boolean; template?: any; error?: string }> {
  try {
    const idStr = String(id);
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    let targetId = idStr;

    if (!uuidRegex.test(idStr)) {
      const numericId = Number(idStr);
      let matchName = "";
      if (!isNaN(numericId)) {
        const foundDef = DEFAULT_AUTOFILL_TEMPLATES.find((d) => d.id === numericId);
        if (foundDef) matchName = foundDef.name;
      }

      const ORConditions: any[] = [
        { name: matchName || idStr },
        { slug: { contains: idStr } },
      ];
      if (matchName) {
        ORConditions.push({ name: { contains: matchName, mode: "insensitive" } });
      }

      const existing = await prisma.autofill_templates.findFirst({
        where: {
          OR: ORConditions,
          deleted_at: null,
        },
        select: { id: true },
      });

      if (existing) {
        targetId = existing.id;
      } else {
        const foundDef = DEFAULT_AUTOFILL_TEMPLATES.find((d) => d.id === numericId || d.name === idStr);
        if (foundDef) {
          const slug = foundDef.slug || `template-${foundDef.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")}`;
          const created = await prisma.autofill_templates.create({
            data: {
              slug,
              name: foundDef.name,
              description: foundDef.description || "",
              category: foundDef.category || "General",
              status: "active",
              is_free,
            },
          });
          targetId = created.id;
        }
      }
    }

    if (adminUser) {
      const permCheck = await evaluateRelationalPermission({
        user: adminUser,
        capability: "edit",
        item: { id: targetId, type: "autofill_template" },
      });
      if (!permCheck.allowed) {
        return { success: false, error: permCheck.reason };
      }
    }

    const updated = await prisma.autofill_templates.update({
      where: { id: targetId },
      data: { is_free, updated_at: new Date() },
    });

    await recordAuditLog({
      adminUserId: adminUser?.id,
      action: "toggle_free",
      category: "autofill_template",
      entityType: "autofill_template",
      entityId: targetId,
      metadata: { is_free, user: adminUser?.name || adminUser?.email },
    });

    revalidatePath("/admin/autofill");
    revalidatePath("/dashboard/clinical-autofills");
    revalidatePath("/dashboard");

    return { success: true, template: updated };
  } catch (error: any) {
    console.error("toggleTemplateFreeStatus error:", error);
    return { success: false, error: error.message || "Failed to update template free status in database." };
  }
}

