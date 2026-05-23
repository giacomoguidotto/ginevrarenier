"use client";

import {
  closestCenter,
  DndContext,
  type DragEndEvent,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { api } from "convex/_generated/api";
import type { Doc } from "convex/_generated/dataModel";
import { useMutation } from "convex/react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Check,
  ChevronDown,
  GripVertical,
  MapPin,
  Plus,
  Send,
  ToggleLeft,
  ToggleRight,
  Trash2,
  Undo2,
} from "lucide-react";
import { useTranslations } from "next-intl";
import {
  type FormEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  ChromeEnablerProvider,
  useChromeEnabler,
} from "@/components/admin/chrome-enabler";
import {
  useDraftBufferOps,
  useEditVersion,
} from "@/components/admin/draft-buffer-context";
import { useEditMode } from "@/components/admin/edit-mode-context";
import { Field } from "@/components/admin/field";
import { FieldChrome } from "@/components/admin/field-chrome";
import { usePageBoundaryRegistration } from "@/components/admin/page-boundary";
import { Section, useSection } from "@/components/admin/section";
import { PageTransition } from "@/components/layout/page-transition";
import { CollapsibleSection } from "@/components/ui/collapsible-section";
import { locales } from "@/i18n/config";
import { useLocalized, useSocialLinks } from "@/lib/hooks";
import {
  getDisplayValue,
  getHref,
  getHrefTemplateParts,
  getIcon,
  getLabel,
  platformKeys,
} from "@/lib/platform-registry";

const inquiryTypeKeys = [
  "collaboration",
  "commission",
  "exhibition",
  "press",
  "other",
] as const;

export function ConnectClient() {
  const [formState, setFormState] = useState({
    name: "",
    email: "",
    inquiryType: "",
    message: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const t = useTranslations("connect");
  const { isEditMode } = useEditMode();
  const { links: socials } = useSocialLinks();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Simulate form submission
    await new Promise((resolve) => setTimeout(resolve, 1500));

    setIsSubmitting(false);
    setIsSubmitted(true);
    setFormState({ name: "", email: "", inquiryType: "", message: "" });
  };

  const emailLinks = socials.filter((s) => s.platform === "email");
  const nonEmailLinks = socials.filter((s) => s.platform !== "email");

  return (
    <PageTransition>
      <div className="min-h-screen pt-32 pb-20">
        <div className="mx-auto max-w-7xl px-6">
          {/* Header */}
          <Section label="Connect" name="connect.header">
            <ChromeEnablerProvider>
              <ConnectHeader />
            </ChromeEnablerProvider>
          </Section>

          <div className="grid gap-16 lg:grid-cols-2">
            {/* Contact Form */}
            <motion.div
              animate={{ opacity: 1, x: 0 }}
              initial={{ opacity: 0, x: -30 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              {isSubmitted ? (
                <motion.div
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex h-full flex-col items-center justify-center rounded-lg border border-border bg-card p-12 text-center"
                  initial={{ opacity: 0, scale: 0.95 }}
                >
                  <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                    <Check className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="mb-4 font-light text-2xl text-foreground">
                    {t("success.title")}
                  </h3>
                  <p className="mb-8 text-muted-foreground">
                    {t("success.description")}
                  </p>
                  <button
                    className="text-muted-foreground text-sm uppercase tracking-widest transition-colors hover:text-foreground"
                    onClick={() => setIsSubmitted(false)}
                    type="button"
                  >
                    {t("success.sendAnother")}
                  </button>
                </motion.div>
              ) : (
                <form className="space-y-6" onSubmit={handleSubmit}>
                  {/* Name */}
                  <div>
                    <label
                      className="mb-2 block text-muted-foreground text-sm uppercase tracking-widest"
                      htmlFor="name"
                    >
                      {t("form.name")}
                    </label>
                    <input
                      className="w-full rounded-lg border border-border bg-card px-4 py-3 text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-primary"
                      id="name"
                      onChange={(e) =>
                        setFormState({ ...formState, name: e.target.value })
                      }
                      placeholder={t("form.namePlaceholder")}
                      required
                      type="text"
                      value={formState.name}
                    />
                  </div>

                  {/* Email */}
                  <div>
                    <label
                      className="mb-2 block text-muted-foreground text-sm uppercase tracking-widest"
                      htmlFor="email"
                    >
                      {t("form.email")}
                    </label>
                    <input
                      className="w-full rounded-lg border border-border bg-card px-4 py-3 text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-primary"
                      id="email"
                      onChange={(e) =>
                        setFormState({ ...formState, email: e.target.value })
                      }
                      placeholder={t("form.emailPlaceholder")}
                      required
                      type="email"
                      value={formState.email}
                    />
                  </div>

                  {/* Inquiry Type */}
                  <div>
                    <label
                      className="mb-2 block text-muted-foreground text-sm uppercase tracking-widest"
                      htmlFor="inquiryType"
                    >
                      {t("form.inquiryType")}
                    </label>
                    <select
                      className="w-full rounded-lg border border-border bg-card px-4 py-3 text-foreground outline-none transition-colors focus:border-primary"
                      id="inquiryType"
                      onChange={(e) =>
                        setFormState({
                          ...formState,
                          inquiryType: e.target.value,
                        })
                      }
                      required
                      value={formState.inquiryType}
                    >
                      <option disabled value="">
                        {t("form.inquiryPlaceholder")}
                      </option>
                      {inquiryTypeKeys.map((key) => (
                        <option key={key} value={key}>
                          {t(`inquiryTypes.${key}`)}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Message */}
                  <div>
                    <label
                      className="mb-2 block text-muted-foreground text-sm uppercase tracking-widest"
                      htmlFor="message"
                    >
                      {t("form.message")}
                    </label>
                    <textarea
                      className="w-full resize-none rounded-lg border border-border bg-card px-4 py-3 text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-primary"
                      id="message"
                      onChange={(e) =>
                        setFormState({ ...formState, message: e.target.value })
                      }
                      placeholder={t("form.messagePlaceholder")}
                      required
                      rows={6}
                      value={formState.message}
                    />
                  </div>

                  {/* Submit Button */}
                  <motion.button
                    className="group relative inline-flex w-full items-center justify-center gap-2 overflow-hidden rounded-lg border border-primary bg-primary px-8 py-4 font-medium text-primary-foreground text-sm uppercase tracking-widest transition-all hover:bg-transparent hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50"
                    disabled={isSubmitting}
                    type="submit"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    {isSubmitting ? (
                      <span className="flex items-center gap-2">
                        <motion.span
                          animate={{ rotate: 360 }}
                          className="block h-4 w-4 rounded-full border-2 border-current border-t-transparent"
                          transition={{
                            duration: 1,
                            repeat: Number.POSITIVE_INFINITY,
                            ease: "linear",
                          }}
                        />
                        {t("form.sending")}
                      </span>
                    ) : (
                      <>
                        <span>{t("form.submit")}</span>
                        <Send className="h-4 w-4" />
                      </>
                    )}
                  </motion.button>
                </form>
              )}
            </motion.div>

            {/* Contact Info */}
            <motion.div
              animate={{ opacity: 1, x: 0 }}
              className="space-y-12"
              initial={{ opacity: 0, x: 30 }}
              transition={{ duration: 0.5, delay: 0.4 }}
            >
              {/* Direct Contact */}
              <SocialSection
                allLinks={socials}
                allowedPlatforms={["email"]}
                links={emailLinks}
                title={t("info.directContact")}
              >
                <Section label="Location" name="connect.location">
                  <ChromeEnablerProvider>
                    <ConnectLocation />
                  </ChromeEnablerProvider>
                </Section>
              </SocialSection>

              {/* Social */}
              <CollapsibleSection
                visible={nonEmailLinks.length > 0 || isEditMode}
              >
                <div data-testid="follow-along">
                  <SocialSection
                    allLinks={socials}
                    allowedPlatforms={platformKeys.filter((k) => k !== "email")}
                    links={nonEmailLinks}
                    title={t("info.followAlong")}
                  />
                </div>
              </CollapsibleSection>

              {/* Availability */}
              <Section label="Availability" name="connect.availability">
                <ChromeEnablerProvider>
                  <ConnectAvailability />
                </ChromeEnablerProvider>
              </Section>
            </motion.div>
          </div>
        </div>
      </div>
    </PageTransition>
  );
}

function ConnectHeader() {
  const { enable } = useChromeEnabler();
  const { data } = useSection();
  const localized = useLocalized();

  return (
    <div className="mb-16 max-w-3xl">
      <motion.div
        animate={{ opacity: 1, y: 0 }}
        initial={{ opacity: 0, y: 20 }}
        transition={{ duration: 0.5 }}
      >
        <Field
          as="p"
          className="mb-4 text-foreground/60 text-sm uppercase tracking-widest"
          name="label"
        />
      </motion.div>
      <motion.div
        animate={{ opacity: 1, y: 0 }}
        initial={{ opacity: 0, y: 20 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        <h1 className="mb-6 text-foreground">
          {data?.title && localized(data.title)}
        </h1>
      </motion.div>
      <motion.div
        animate={{ opacity: 1, y: 0 }}
        initial={{ opacity: 0, y: 20 }}
        onAnimationComplete={enable}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <Field
          as="p"
          className="text-lg text-muted-foreground"
          name="description"
        />
      </motion.div>
    </div>
  );
}

function ConnectLocation() {
  const { enable } = useChromeEnabler();
  const { isEditMode } = useEditMode();
  const t = useTranslations("connect");

  return (
    <div className={`flex items-center gap-4 ${isEditMode ? "pr-9" : ""}`}>
      <MapPin className="h-5 w-5 text-foreground/60" />
      <div className="flex-1">
        <p className="text-muted-foreground text-sm">{t("info.basedIn")}</p>
        <motion.div
          animate={{ opacity: 1 }}
          initial={{ opacity: 0 }}
          onAnimationComplete={enable}
          transition={{ duration: 0.3 }}
        >
          <Field as="p" className="text-foreground text-lg" name="location" />
        </motion.div>
      </div>
    </div>
  );
}

function ConnectAvailability() {
  const { enable } = useChromeEnabler();
  const { isEditMode } = useEditMode();
  const { name: sectionName, data } = useSection();
  const { read, write } = useDraftBufferOps();
  useEditVersion();
  const t = useTranslations("connect");
  const localized = useLocalized();

  useEffect(() => {
    enable();
  }, [enable]);

  const draftAvailable = read(sectionName, "available", "en");
  const convexAvailable = data?.available?.en;
  const isAvailable = (draftAvailable ?? convexAvailable ?? "true") === "true";

  const handleToggle = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest(".editable-field")) {
      return;
    }
    const newValue = isAvailable ? "false" : "true";
    for (const l of locales) {
      write(sectionName, "available", l, newValue);
    }
  };

  const dotColor = isAvailable ? "bg-green-500" : "bg-red-500";
  const textColor = isAvailable
    ? "text-green-600 dark:text-green-400"
    : "text-red-600 dark:text-red-400";
  const status = isAvailable
    ? t("info.availability.status")
    : t("info.availability.statusUnavailable");

  const descriptionFieldName = isAvailable
    ? "description"
    : "descriptionUnavailable";

  if (!isEditMode) {
    const fallbackDescription = isAvailable
      ? t("info.availability.description")
      : t("info.availability.descriptionUnavailable");
    const description = data?.[descriptionFieldName]
      ? localized(data[descriptionFieldName])
      : fallbackDescription;

    return (
      <div className="rounded-lg border border-border bg-card p-6">
        <h3 className="mb-4 text-muted-foreground text-sm uppercase tracking-widest">
          {t("info.availability.title")}
        </h3>
        <p className="text-foreground">{description}</p>
        <div className="mt-4 flex items-center gap-2">
          <span className={`h-2 w-2 rounded-full ${dotColor}`} />
          <span className={`text-sm ${textColor}`}>{status}</span>
        </div>
      </div>
    );
  }

  const ToggleIcon = isAvailable ? ToggleRight : ToggleLeft;
  const toggleColor = isAvailable ? "text-green-500" : "text-red-500";

  return (
    <button
      className="group relative w-full cursor-pointer rounded-lg border border-border bg-card p-6 text-left transition-colors hover:border-muted-foreground/40"
      onClick={handleToggle}
      type="button"
    >
      <ToggleIcon
        className={`absolute top-3 right-3 h-5 w-5 ${toggleColor} opacity-50 transition-opacity group-hover:opacity-100`}
      />
      <h3 className="mb-4 text-muted-foreground text-sm uppercase tracking-widest">
        {t("info.availability.title")}
      </h3>
      <Field
        as="p"
        className="text-foreground"
        key={descriptionFieldName}
        name={descriptionFieldName}
      />
      <div className="mt-4 flex items-center gap-2">
        <span
          className={`h-2 w-2 rounded-full ${dotColor} transition-colors`}
        />
        <span className={`text-sm ${textColor} transition-colors`}>
          {status}
        </span>
      </div>
    </button>
  );
}

// --- Social link rendering (unified view + edit mode) ---

function SocialSection({
  links,
  allLinks,
  title,
  allowedPlatforms,
  children,
}: {
  links: Doc<"socialLinks">[];
  allLinks: Doc<"socialLinks">[];
  title: string;
  allowedPlatforms: readonly string[];
  children?: React.ReactNode;
}) {
  const { isEditMode } = useEditMode();
  const { trackCreation, setReorderList, getReorderList } = useDraftBufferOps();
  useEditVersion();

  const createSocialLink = useMutation(api.socialLinks.create);

  const reorderList = getReorderList("social-link");

  const displayLinks = reorderList
    ? reorderList
        .map((id) => links.find((l) => l._id === id))
        .filter((l): l is Doc<"socialLinks"> => l !== undefined)
        .concat(links.filter((l) => !reorderList.includes(l._id)))
    : links;

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 200, tolerance: 5 },
    })
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over || active.id === over.id) {
        return;
      }

      const oldIndex = displayLinks.findIndex((l) => l._id === active.id);
      const newIndex = displayLinks.findIndex((l) => l._id === over.id);
      if (oldIndex === -1 || newIndex === -1) {
        return;
      }

      const reordered = [...displayLinks];
      const [moved] = reordered.splice(oldIndex, 1);
      reordered.splice(newIndex, 0, moved);

      const otherLinks = allLinks.filter(
        (l) => !links.some((sl) => sl._id === l._id)
      );
      const fullOrder = [...reordered, ...otherLinks];
      setReorderList(
        "social-link",
        fullOrder.map((l) => l._id)
      );
    },
    [displayLinks, allLinks, links, setReorderList]
  );

  const handleCreate = useCallback(async () => {
    const defaultPlatform = allowedPlatforms[0] ?? "website";
    const id = await createSocialLink({
      platform: defaultPlatform,
      handle: "",
    });
    trackCreation("social-link", id);
  }, [createSocialLink, trackCreation, allowedPlatforms]);

  const content = (
    <div className="space-y-4">
      {displayLinks.map((link) => (
        <SocialLinkRow key={link._id} link={link} />
      ))}
    </div>
  );

  return (
    <div>
      <h3 className="mb-6 text-muted-foreground text-sm uppercase tracking-widest">
        {title}
      </h3>
      {children && <div className="mb-4 space-y-4">{children}</div>}
      {isEditMode ? (
        <DndContext
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
          sensors={sensors}
        >
          <SortableContext
            items={displayLinks.map((l) => l._id)}
            strategy={verticalListSortingStrategy}
          >
            {content}
          </SortableContext>
        </DndContext>
      ) : (
        content
      )}
      <AnimatePresence>
        {isEditMode && (
          <motion.div
            animate={{ height: "auto", opacity: 1 }}
            className="overflow-hidden"
            exit={{ height: 0, opacity: 0 }}
            initial={{ height: 0, opacity: 0 }}
            key="add-button"
            transition={{ duration: 0.2, ease: "easeInOut" }}
          >
            <button
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg border-2 border-foreground/15 border-dashed py-3 text-foreground/30 transition-colors hover:border-foreground/30 hover:text-foreground/50"
              onClick={handleCreate}
              type="button"
            >
              <Plus className="h-4 w-4" />
              <span className="text-sm">
                Add{" "}
                {allowedPlatforms.length === 1
                  ? getLabel(allowedPlatforms[0])
                  : "social link"}
              </span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function SocialLinkRow({ link }: { link: Doc<"socialLinks"> }) {
  const { isEditMode } = useEditMode();
  const {
    isPendingDeletion,
    trackDeletion,
    cancelDeletion,
    read,
    write,
    removeEdit,
  } = useDraftBufferOps();
  useEditVersion();

  const pendingDeletion = isPendingDeletion("social-link", link._id);
  const section = `social-link:${link._id}`;

  const draftPlatform = read(section, "platform", locales[0]);
  const draftHandle = read(section, "handle", locales[0]);

  const platform = draftPlatform ?? link.platform;
  const handle = draftHandle ?? link.handle ?? "";

  usePageBoundaryRegistration(section, getLabel(platform));

  const Icon = getIcon(platform);
  const label = getLabel(platform);
  const displayValue = getDisplayValue(platform, handle);
  const href = getHref(platform, handle);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: link._id,
    disabled: !isEditMode || pendingDeletion,
  });

  const wasDraggingRef = useRef(false);
  useEffect(() => {
    if (isDragging) {
      wasDraggingRef.current = true;
    }
  }, [isDragging]);

  const handleClickCapture = (e: React.MouseEvent) => {
    if (wasDraggingRef.current) {
      e.preventDefault();
      e.stopPropagation();
      wasDraggingRef.current = false;
    }
  };

  const style = isEditMode
    ? { transform: CSS.Transform.toString(transform), transition }
    : undefined;

  if (!isEditMode) {
    const isEmail = platform === "email";
    if (isEmail) {
      return (
        <div className="flex items-center gap-4">
          <Icon className="h-5 w-5 text-foreground/60" />
          <div>
            <p className="text-muted-foreground text-sm">{label}</p>
            <a
              className="text-foreground text-lg transition-colors hover:text-foreground/80"
              href={href}
            >
              {displayValue}
            </a>
          </div>
        </div>
      );
    }
    return (
      <a
        className="flex items-center gap-4 transition-colors"
        href={href}
        rel="noopener noreferrer"
        target="_blank"
      >
        <Icon className="h-5 w-5 text-foreground/60" />
        <div>
          <p className="text-muted-foreground text-sm">{label}</p>
          <p className="text-foreground text-lg transition-colors hover:text-foreground/80">
            {displayValue}
          </p>
        </div>
      </a>
    );
  }

  // Edit mode
  return (
    <div
      className={`relative flex items-center gap-4 ${pendingDeletion ? "opacity-40" : ""}`}
      onClickCapture={handleClickCapture}
      ref={setNodeRef}
      style={style}
    >
      <button
        aria-label="Drag to reorder"
        className="absolute top-0 bottom-0 -left-7 my-auto flex h-5 cursor-grab items-center text-foreground/30 hover:text-foreground/60 active:cursor-grabbing"
        type="button"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="h-5 w-5" />
      </button>

      <Icon className="h-5 w-5 shrink-0 text-foreground/60" />

      <div className="min-w-0 flex-1">
        <PlatformDropdown
          onSelect={(newPlatform) => {
            if (newPlatform !== (link.platform ?? platform)) {
              for (const l of locales) {
                write(section, "platform", l, newPlatform);
              }
            } else if (draftPlatform !== undefined) {
              for (const l of locales) {
                removeEdit(section, "platform", l);
              }
            }
          }}
          platform={platform}
        />
        <HandleEditor
          handle={handle}
          platform={platform}
          section={section}
          sourceHandle={link.handle ?? ""}
        />
      </div>

      {pendingDeletion ? (
        <button
          aria-label="Undo delete"
          className="shrink-0 text-foreground/40 transition-colors hover:text-foreground"
          onClick={() => cancelDeletion("social-link", link._id)}
          type="button"
        >
          <Undo2 className="h-5 w-5" />
        </button>
      ) : (
        <button
          aria-label="Delete social link"
          className="shrink-0 text-foreground/30 transition-colors hover:text-destructive"
          onClick={() => trackDeletion("social-link", link._id)}
          type="button"
        >
          <Trash2 className="h-5 w-5" />
        </button>
      )}
    </div>
  );
}

function PlatformDropdown({
  platform,
  onSelect,
}: {
  platform: string;
  onSelect: (platform: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) {
      return;
    }
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        className="flex cursor-pointer items-center gap-1 text-muted-foreground text-sm transition-colors hover:text-foreground"
        onClick={() => setOpen(!open)}
        type="button"
      >
        {getLabel(platform)}
        <ChevronDown
          className={`h-3 w-3 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div className="absolute top-full left-0 z-50 mt-1 max-h-64 w-56 overflow-y-auto rounded-lg border border-border bg-card shadow-lg">
          {platformKeys.map((key) => {
            const PIcon = getIcon(key);
            return (
              <button
                className={`flex w-full items-center gap-3 px-3 py-2 text-left text-sm transition-colors hover:bg-muted ${
                  key === platform
                    ? "bg-muted text-foreground"
                    : "text-muted-foreground"
                }`}
                key={key}
                onClick={() => {
                  onSelect(key);
                  setOpen(false);
                }}
                type="button"
              >
                <PIcon className="h-4 w-4 shrink-0" />
                {getLabel(key)}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

function HandleEditor({
  platform,
  handle,
  sourceHandle,
  section,
}: {
  platform: string;
  handle: string;
  sourceHandle: string;
  section: string;
}) {
  const { write, removeEdit, read, fieldStatus } = useDraftBufferOps();
  const { enabled } = useChromeEnabler();
  const elRef = useRef<HTMLSpanElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [focused, setFocused] = useState(false);
  const [dims, setDims] = useState({ width: 0, height: 0 });
  const { prefix, suffix } = getHrefTemplateParts(platform);

  const displayHandle = handle;

  useEffect(() => {
    if (elRef.current && elRef.current.textContent !== displayHandle) {
      elRef.current.textContent = displayHandle;
    }
  }, [displayHandle]);

  useEffect(() => {
    const el = wrapperRef.current;
    if (!el) {
      return;
    }
    const ro = new ResizeObserver(() => {
      setDims({ width: el.clientWidth, height: el.clientHeight });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const handleInput = () => {
    const text = elRef.current?.textContent ?? "";
    if (text === sourceHandle) {
      const drafted = read(section, "handle", locales[0]);
      if (drafted !== undefined) {
        for (const l of locales) {
          removeEdit(section, "handle", l);
        }
      }
    } else {
      for (const l of locales) {
        write(section, "handle", l, text);
      }
    }
  };

  const handleFocus = () => setFocused(true);
  const handleBlur = () => {
    handleInput();
    setFocused(false);
  };

  const status = fieldStatus(section, "handle", locales[0]);

  const chrome = enabled ? (
    <FieldChrome
      fieldStatus={status}
      focused={focused}
      height={dims.height}
      staleLocale={null}
      width={dims.width}
    />
  ) : null;

  const isSpecial = platform === "email" || platform === "website";

  if (isSpecial) {
    return (
      <div ref={wrapperRef} style={{ position: "relative" }}>
        {/* biome-ignore lint/a11y/useSemanticElements: contentEditable span, not replaceable with input */}
        <span
          className="block text-foreground text-lg outline-none"
          contentEditable={"plaintext-only" as const}
          onBlur={handleBlur}
          onFocus={handleFocus}
          onInput={handleInput}
          ref={elRef as React.RefObject<never>}
          role="textbox"
          suppressContentEditableWarning
          tabIndex={0}
        />
        {chrome}
      </div>
    );
  }

  const focusEditable = (e: React.MouseEvent) => {
    if ((e.target as Node) !== elRef.current && elRef.current) {
      e.preventDefault();
      elRef.current.focus();
    }
  };

  return (
    // biome-ignore lint/a11y/noNoninteractiveElementInteractions: click-to-focus wrapper for contentEditable
    // biome-ignore lint/a11y/noStaticElementInteractions: click-to-focus wrapper for contentEditable
    // biome-ignore lint/a11y/useKeyWithClickEvents: inner contentEditable handles keyboard
    <div
      onClick={focusEditable}
      ref={wrapperRef}
      style={{ position: "relative" }}
    >
      <span className="block text-lg">
        <span className="text-foreground/30">{prefix}</span>
        {/* biome-ignore lint/a11y/useSemanticElements: inline contentEditable within URL template */}
        <span
          className="text-foreground outline-none"
          contentEditable={"plaintext-only" as const}
          onBlur={handleBlur}
          onFocus={handleFocus}
          onInput={handleInput}
          ref={elRef as React.RefObject<never>}
          role="textbox"
          suppressContentEditableWarning
          tabIndex={0}
        />
        <span className="text-foreground/30">{suffix}</span>
      </span>
      {chrome}
    </div>
  );
}
