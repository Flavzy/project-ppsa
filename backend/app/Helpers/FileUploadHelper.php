<?php

namespace App\Helpers;

use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

class FileUploadHelper
{
    /**
     * Store an uploaded file preserving its original name.
     * If a file with that name already exists in the target directory,
     * appends a timestamp suffix to prevent collision while keeping
     * the original name intact.
     *
     * @param UploadedFile $file
     * @param string $folder
     * @param string $disk
     * @return string Relative stored path (e.g. "reporting/fherta_ganteng.pdf")
     */
    public static function storeWithOriginalName(UploadedFile $file, string $folder, string $disk = 'public'): string
    {
        $originalClientName = $file->getClientOriginalName();
        $nameOnly = pathinfo($originalClientName, PATHINFO_FILENAME);
        $extension = $file->getClientOriginalExtension() ?: pathinfo($originalClientName, PATHINFO_EXTENSION);

        // Sanitize filename for filesystem compatibility while preserving alphanumeric, spaces, dashes, dots
        $safeNameOnly = preg_replace('~[\\\\/:*?"<>|]~', '_', $nameOnly);
        $safeNameOnly = trim($safeNameOnly);
        if ($safeNameOnly === '') {
            $safeNameOnly = 'dokumen';
        }

        $filename = $extension ? "{$safeNameOnly}.{$extension}" : $safeNameOnly;
        $targetPath = "{$folder}/{$filename}";

        if (Storage::disk($disk)->exists($targetPath)) {
            $timestamp = date('Ymd_His') . '_' . substr(uniqid(), 0, 4);
            $filename = $extension ? "{$safeNameOnly}_{$timestamp}.{$extension}" : "{$safeNameOnly}_{$timestamp}";
        }

        return $file->storeAs($folder, $filename, $disk);
    }
}
