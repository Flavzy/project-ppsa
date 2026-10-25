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
        $extension = strtolower($file->getClientOriginalExtension() ?: pathinfo($originalClientName, PATHINFO_EXTENSION));

        // Block dangerous executable/script extensions in public storage
        $forbiddenExtensions = ['php', 'php3', 'php4', 'php5', 'php7', 'php8', 'phtml', 'phar', 'sh', 'bat', 'cmd', 'exe', 'cgi', 'pl', 'htaccess'];
        if (in_array($extension, $forbiddenExtensions, true)) {
            $extension = 'txt';
        }

        // Sanitize filename for filesystem compatibility while preserving alphanumeric, spaces, dashes, dots
        $safeNameOnly = preg_replace('~[\\\\/:*?"<>|]~', '_', $nameOnly);
        $safeNameOnly = str_replace('..', '_', $safeNameOnly);
        $safeNameOnly = trim($safeNameOnly, " .\t\n\r\0\x0B");
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
