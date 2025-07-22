#!/bin/bash

echo "Testing HEIF support in dpokidov/imagemagick Docker container..."

echo "1. Checking ImageMagick version:"
magick --version

echo -e "\n2. Checking HEIF format support:"
magick -list format | grep -i heic

echo -e "\n3. Checking supported image formats:"
magick -list format | grep -E "(HEIC|HEIF|JPEG|PNG|WEBP|AVIF)"

echo -e "\n4. Checking heif-convert availability:"
which heif-convert && echo "heif-convert found" || echo "heif-convert not found"

echo -e "\n5. Testing file operations:"
touch /tmp/test.txt && echo "File operations work" || echo "File operations failed"

echo -e "\nDPOKIDOV ImageMagick HEIF setup validation complete!" 