-- Remove duplicate size options already stored for the same painting.
-- Keeps the oldest row for each painting + size definition and repoints cart
-- selections before removing duplicates. Price is included so two sizes with
-- the same dimensions but different prices remain valid separate options.
START TRANSACTION;

UPDATE cart_items ci
INNER JOIN painting_size_options duplicate_option
    ON duplicate_option.id = ci.size_option_id
INNER JOIN painting_size_options keeper
    ON keeper.painting_id = duplicate_option.painting_id
   AND LOWER(TRIM(keeper.name)) = LOWER(TRIM(duplicate_option.name))
   AND keeper.width = duplicate_option.width
   AND keeper.height = duplicate_option.height
   AND LOWER(TRIM(keeper.unit)) = LOWER(TRIM(duplicate_option.unit))
   AND keeper.price = duplicate_option.price
   AND keeper.id < duplicate_option.id
SET ci.size_option_id = keeper.id;

DELETE duplicate_option
FROM painting_size_options duplicate_option
INNER JOIN painting_size_options keeper
    ON keeper.painting_id = duplicate_option.painting_id
   AND LOWER(TRIM(keeper.name)) = LOWER(TRIM(duplicate_option.name))
   AND keeper.width = duplicate_option.width
   AND keeper.height = duplicate_option.height
   AND LOWER(TRIM(keeper.unit)) = LOWER(TRIM(duplicate_option.unit))
   AND keeper.price = duplicate_option.price
   AND keeper.id < duplicate_option.id;

COMMIT;
