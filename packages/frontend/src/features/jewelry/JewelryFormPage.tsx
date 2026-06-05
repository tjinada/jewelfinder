import { useEffect, useState, type FormEvent, type ReactNode } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ImagePlus, X, Loader2 } from 'lucide-react';
import {
  CATEGORIES,
  CATEGORY_LABELS,
  CATEGORY_ATTRIBUTES,
  METALS,
  METAL_LABELS,
  BANGLE_SIZES,
  NECKLACE_TYPES,
  NECKLACE_TYPE_LABELS,
  COLOURS,
  type Category,
  type Availability,
} from '@jewel/shared';
import { MainLayout } from '@/components/layout';
import { Button } from '@/components/ui';
import { cn } from '@/lib/utils';
import { thumbImageUrl } from '@/lib/media';
import {
  useCreateJewelry,
  useUpdateJewelry,
  useUploadImages,
  useJewelryItem,
  type JewelryInput,
} from './api';
import { getErrorMessage } from '@/features/auth';
import { SetSelect, type SetSelection, useCreateSet } from '@/features/sets';
import { VisibilitySelect, type VisibilitySelection } from '@/features/closets';
import { useAuthStore } from '@/stores/authStore';

const labelClass = 'mb-1.5 block text-xs font-bold uppercase tracking-wide text-muted';
const selectClass =
  'w-full rounded-xl border border-line bg-surface px-4 py-3 text-sm text-ink outline-none focus:border-primary focus:ring-2 focus:ring-primary/20';

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <span className={labelClass}>{label}</span>
      {children}
    </div>
  );
}

export function JewelryFormPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const editing = !!id;
  const userLocation = useAuthStore((s) => s.user?.location ?? '');

  const { data: existing, isLoading: loadingExisting } = useJewelryItem(id);
  const upload = useUploadImages();
  const create = useCreateJewelry();
  const update = useUpdateJewelry(id ?? '');
  const createSet = useCreateSet();

  const [name, setName] = useState('');
  const [category, setCategory] = useState<Category | ''>('');
  const [images, setImages] = useState<string[]>([]);
  const [availability, setAvailability] = useState<Availability>('available');
  const [metal, setMetal] = useState<string | undefined>();
  const [colour, setColour] = useState<string | undefined>();
  const [size, setSize] = useState<string | undefined>();
  const [necklaceType, setNecklaceType] = useState<string | undefined>();
  const [setSel, setSetSel] = useState<SetSelection>({ mode: 'none' });
  const [vis, setVis] = useState<VisibilitySelection>({ visibility: 'private', sharedGroups: [] });
  const [location, setLocation] = useState(userLocation);
  const [error, setError] = useState('');

  // Prefill in edit mode
  useEffect(() => {
    if (existing) {
      setName(existing.name ?? '');
      setCategory(existing.category);
      setImages(existing.images);
      setAvailability(existing.availability);
      setMetal(existing.metal);
      setColour(existing.colour);
      setSize(existing.size);
      setNecklaceType(existing.necklaceType);
      setSetSel(existing.set ? { mode: 'existing', id: existing.set } : { mode: 'none' });
      setVis({ visibility: existing.visibility, sharedGroups: existing.sharedGroups });
      setLocation(existing.location ?? '');
    }
  }, [existing]);

  const applicable = category ? CATEGORY_ATTRIBUTES[category] : [];

  // Clear attributes that don't apply when the category changes.
  const onCategoryChange = (next: Category | '') => {
    setCategory(next);
    const allowed = next ? CATEGORY_ATTRIBUTES[next] : [];
    if (!allowed.includes('metal')) setMetal(undefined);
    if (!allowed.includes('colour')) setColour(undefined);
    if (!allowed.includes('size')) setSize(undefined);
    if (!allowed.includes('necklaceType')) setNecklaceType(undefined);
  };

  const onFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    e.target.value = '';
    if (!files.length) return;
    setError('');
    try {
      const stored = await upload.mutateAsync(files);
      setImages((prev) => [...prev, ...stored.map((s) => s.filename)].slice(0, 8));
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  const removeImage = (file: string) => setImages((prev) => prev.filter((f) => f !== file));

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    if (!name.trim()) return setError('Please enter a name.');
    if (!category) return setError('Please choose a category.');
    if (images.length === 0) return setError('Please add at least one photo.');
    if (setSel.mode === 'new' && !setSel.name.trim()) {
      return setError('Please name the new set, or choose “Not part of a set”.');
    }
    if (vis.visibility === 'groups' && vis.sharedGroups.length === 0) {
      return setError('Pick at least one closet, or choose a different visibility.');
    }

    try {
      let setId: string | null = null;
      if (setSel.mode === 'existing') setId = setSel.id;
      else if (setSel.mode === 'new') {
        const created = await createSet.mutateAsync(setSel.name.trim());
        setId = created._id;
      }

      const payload: JewelryInput = {
        name: name.trim(),
        category,
        images,
        availability,
        set: setId,
        visibility: vis.visibility,
        sharedGroups: vis.visibility === 'groups' ? vis.sharedGroups : undefined,
        location: location.trim() || undefined,
        metal: applicable.includes('metal') ? metal : undefined,
        colour: applicable.includes('colour') ? colour : undefined,
        size: applicable.includes('size') ? size : undefined,
        necklaceType: applicable.includes('necklaceType') ? necklaceType : undefined,
      };

      const result = editing ? await update.mutateAsync(payload) : await create.mutateAsync(payload);
      navigate(`/item/${result._id}`, { replace: true });
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  const saving = create.isPending || update.isPending || createSet.isPending;

  if (editing && loadingExisting) {
    return (
      <MainLayout>
        <div className="flex justify-center py-20">
          <Loader2 className="h-7 w-7 animate-spin text-primary" />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="mx-auto max-w-2xl">
        <h1 className="mb-5 font-display text-2xl text-ink md:text-3xl">
          {editing ? 'Edit item' : 'Add jewelry'}
        </h1>

        <form onSubmit={onSubmit} className="space-y-5">
          {/* Photos */}
          <Field label="Photos">
            <div className="flex flex-wrap gap-3">
              {images.map((file) => (
                <div key={file} className="relative h-24 w-24 overflow-hidden rounded-xl border border-line bg-tile">
                  <img src={thumbImageUrl(file)} alt="" className="h-full w-full object-cover" />
                  <button
                    type="button"
                    onClick={() => removeImage(file)}
                    aria-label="Remove photo"
                    className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-ink/70 text-white"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}

              {images.length < 8 && (
                <label className="flex h-24 w-24 cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-line text-muted hover:border-primary/50 hover:text-primary">
                  {upload.isPending ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <>
                      <ImagePlus className="h-5 w-5" />
                      <span className="text-[11px] font-semibold">Add</span>
                    </>
                  )}
                  <input type="file" accept="image/*" multiple className="hidden" onChange={onFiles} />
                </label>
              )}
            </div>
          </Field>

          {/* Name */}
          <Field label="Name">
            <input
              type="text"
              maxLength={60}
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Kemp Choker"
              className={selectClass}
            />
          </Field>

          {/* Category */}
          <Field label="Category">
            <select
              value={category}
              onChange={(e) => onCategoryChange(e.target.value as Category | '')}
              className={selectClass}
              required
            >
              <option value="" disabled>
                Choose a category…
              </option>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {CATEGORY_LABELS[c]}
                </option>
              ))}
            </select>
          </Field>

          {/* Config-driven attributes */}
          {applicable.includes('metal') && (
            <Field label="Metal">
              <select
                value={metal ?? ''}
                onChange={(e) => setMetal(e.target.value || undefined)}
                className={selectClass}
              >
                <option value="">Not set</option>
                {METALS.map((m) => (
                  <option key={m} value={m}>
                    {METAL_LABELS[m]}
                  </option>
                ))}
              </select>
            </Field>
          )}

          {applicable.includes('necklaceType') && (
            <Field label="Type">
              <select
                value={necklaceType ?? ''}
                onChange={(e) => setNecklaceType(e.target.value || undefined)}
                className={selectClass}
              >
                <option value="">Not set</option>
                {NECKLACE_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {NECKLACE_TYPE_LABELS[t]}
                  </option>
                ))}
              </select>
            </Field>
          )}

          {applicable.includes('size') && (
            <Field label="Size">
              <select
                value={size ?? ''}
                onChange={(e) => setSize(e.target.value || undefined)}
                className={selectClass}
              >
                <option value="">Not set</option>
                {BANGLE_SIZES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </Field>
          )}

          {applicable.includes('colour') && (
            <Field label="Colour">
              <select
                value={colour ?? ''}
                onChange={(e) => setColour(e.target.value || undefined)}
                className={selectClass}
              >
                <option value="">Not set</option>
                {COLOURS.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.label}
                  </option>
                ))}
              </select>
            </Field>
          )}

          {/* Location — defaults to your profile location, editable per item */}
          <Field label="Location">
            <input
              type="text"
              maxLength={120}
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="City or area (e.g. Brampton, ON)"
              className={selectClass}
            />
          </Field>

          {/* Set membership — available for any category */}
          <Field label="Set">
            <SetSelect value={setSel} onChange={setSetSel} />
          </Field>

          {/* Visibility — who can see this item */}
          <Field label="Visibility">
            <VisibilitySelect value={vis} onChange={setVis} />
          </Field>

          {/* Availability */}
          <Field label="Availability">
            <div className="flex gap-2">
              {(['available', 'onLoan'] as const).map((a) => (
                <button
                  type="button"
                  key={a}
                  onClick={() => setAvailability(a)}
                  className={cn(
                    'flex-1 rounded-xl border px-4 py-3 text-sm font-semibold',
                    availability === a
                      ? a === 'available'
                        ? 'border-available bg-[#E2F0EA] text-available'
                        : 'border-onloan bg-[#F4E7D5] text-onloan'
                      : 'border-line bg-surface text-ink/60',
                  )}
                >
                  {a === 'available' ? 'Available' : 'On loan'}
                </button>
              ))}
            </div>
          </Field>

          {error && (
            <p className="rounded-lg bg-[#F4E7D5] px-3 py-2 text-sm text-onloan">{error}</p>
          )}

          <div className="flex gap-3 pt-1">
            <Button type="submit" disabled={saving} className="flex-1">
              {saving ? 'Saving…' : editing ? 'Save changes' : 'Post'}
            </Button>
            <Button type="button" variant="ghost" onClick={() => navigate(-1)}>
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </MainLayout>
  );
}
