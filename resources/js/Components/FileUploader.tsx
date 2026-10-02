import ImageEditorModal from '@/Components/ImageEditorModal';
import { cn } from '@/lib/utils';
import type { FilePond as FilePondInstance, FilePondFile } from 'filepond';
import FilePondPluginFileValidateType from 'filepond-plugin-file-validate-type';
import FilePondPluginImageExifOrientation from 'filepond-plugin-image-exif-orientation';
import FilePondPluginImagePreview from 'filepond-plugin-image-preview';
import { useEffect, useRef, useState } from 'react';
import { FilePond, registerPlugin } from 'react-filepond';

import 'filepond/dist/filepond.min.css';
import 'filepond-plugin-image-preview/dist/filepond-plugin-image-preview.css';

registerPlugin(
    FilePondPluginFileValidateType,
    FilePondPluginImageExifOrientation,
    FilePondPluginImagePreview,
);

type FileUploaderProps = {
    existingUrl?: string | null;
    onChange: (file: File | null) => void;
    onClearExisting?: () => void;
    accept?: string[];
    labelIdle?: string;
    allowImageEdit?: boolean;
    className?: string;
    disabled?: boolean;
};

function isImageFile(file: Blob): boolean {
    return (file.type || '').startsWith('image/');
}

export default function FileUploader({
    existingUrl = null,
    onChange,
    onClearExisting,
    accept = ['image/*'],
    labelIdle = 'Arrastra un archivo o <span class="filepond--label-action">explora</span>',
    allowImageEdit = true,
    className,
    disabled = false,
}: FileUploaderProps) {
    const [files, setFiles] = useState<FilePondFile[]>([]);
    const [pendingEdit, setPendingEdit] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const pondRef = useRef<FilePondInstance | null>(null);
    const ignoreRemove = useRef(false);

    useEffect(() => {
        return () => {
            if (previewUrl) URL.revokeObjectURL(previewUrl);
        };
    }, [previewUrl]);

    const setFile = (file: File | null) => {
        setPreviewUrl((prev) => {
            if (prev) URL.revokeObjectURL(prev);
            return file && isImageFile(file) ? URL.createObjectURL(file) : null;
        });
        onChange(file);
    };

    return (
        <div className={cn('unitra-filepond space-y-3', className)}>
            {existingUrl && !previewUrl && files.length === 0 && (
                <div className="flex items-center gap-3 rounded-lg border border-[#E3E5E0] bg-[#F5F6F3] p-3">
                    <img
                        src={existingUrl}
                        alt="Logo actual"
                        className="h-16 w-16 rounded object-contain bg-white"
                    />
                    <div className="min-w-0 flex-1 text-sm">
                        <p className="font-medium">Logo actual</p>
                        <p className="text-xs text-[#6B7069]">
                            Sube otro para reemplazarlo
                        </p>
                    </div>
                    {onClearExisting && (
                        <button
                            type="button"
                            className="rounded-md border border-[#E3E5E0] bg-white px-2.5 py-1.5 text-xs"
                            onClick={() => {
                                onClearExisting();
                                setFile(null);
                            }}
                        >
                            Quitar
                        </button>
                    )}
                </div>
            )}

            {previewUrl && (
                <div className="rounded-lg border border-[#E3E5E0] bg-[#F5F6F3] p-3">
                    <img
                        src={previewUrl}
                        alt="Vista previa"
                        className="mx-auto max-h-40 object-contain"
                    />
                </div>
            )}

            <FilePond
                ref={(ref) => {
                    pondRef.current = ref as unknown as FilePondInstance | null;
                }}
                files={files}
                onupdatefiles={setFiles}
                onaddfile={(_, item) => {
                    const file = item.file;
                    if (!(file instanceof File)) return;
                    if (allowImageEdit && isImageFile(file)) {
                        setPendingEdit(file);
                        return;
                    }
                    setFile(file);
                }}
                onremovefile={() => {
                    if (ignoreRemove.current) {
                        ignoreRemove.current = false;
                        return;
                    }
                    setPendingEdit(null);
                    if (existingUrl) onClearExisting?.();
                    setFile(null);
                }}
                allowMultiple={false}
                maxFiles={1}
                disabled={disabled}
                credits={false}
                instantUpload={false}
                acceptedFileTypes={accept}
                labelIdle={labelIdle}
                imagePreviewHeight={140}
                stylePanelLayout="compact"
                server={null}
            />

            {pendingEdit && (
                <ImageEditorModal
                    file={pendingEdit}
                    onCancel={() => {
                        setPendingEdit(null);
                        ignoreRemove.current = true;
                        pondRef.current?.removeFiles();
                        setFile(null);
                    }}
                    onSave={(edited) => {
                        setPendingEdit(null);
                        setFile(edited);
                        ignoreRemove.current = true;
                        pondRef.current?.removeFiles();
                    }}
                />
            )}
        </div>
    );
}
