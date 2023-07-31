import useTranslation from '../../hooks/useTranslation';

export const useZxcvbnTranslations = () => {
  const { t } = useTranslation();

  // enable translation of these strings from zxcvbn library:
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const zxcvbnMessages = [
    // warnings
    t("Straight rows of keys are easy to guess"),
    t("Use a longer keyboard pattern with more turns"),
    t('Repeats like "aaa" are easy to guess'),
    t('Repeats like "abcabcabc" are only slightly harder to guess than "abc"'),
    t("Sequences like abc or 6543 are easy to guess"),
    t("Recent years are easy to guess"),
    t("Dates are often easy to guess"),
    t("This is a top-10 common password"),
    t("This is a top-100 common password"),
    t("This is a very common password"),
    t("This is similar to a commonly used password"),
    t("A word by itself is easy to guess"),
    t("Names and surnames by themselves are easy to guess"),
    t("Common names and surnames are easy to guess"),
    t("Short keyboard patterns are easy to guess"),

    // suggestions
    t("Use a few words, avoid common phrases"),
    t("No need for symbols, digits, or uppercase letters"),
    t("Add another word or two. Uncommon words are better."),
    t("Avoid repeated words and characters"),
    t("Avoid sequences"),
    t("Avoid recent years"),
    t("Avoid years that are associated with you"),
    t("Avoid dates and years that are associated with you"),
    t("Capitalization doesn't help very much"),
    t("All-uppercase is almost as easy to guess as all-lowercase"),
    t("Reversed words aren't much harder to guess"),
    t("Predictable substitutions like '@' instead of 'a' don't help very much"),
  ];
};
