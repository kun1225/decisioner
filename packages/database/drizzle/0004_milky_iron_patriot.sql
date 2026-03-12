WITH normalized_items AS (
  SELECT
    id,
    row_number() OVER (
      PARTITION BY template_id
      ORDER BY sort_order, id
    ) - 1 AS normalized_sort_order
  FROM "template_items"
)
UPDATE "template_items" AS template_items
SET "sort_order" = normalized_items.normalized_sort_order
FROM normalized_items
WHERE template_items.id = normalized_items.id;
--> statement-breakpoint
ALTER TABLE "template_items" ADD CONSTRAINT "template_items_template_id_sort_order_unique" UNIQUE("template_id","sort_order");
