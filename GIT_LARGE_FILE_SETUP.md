# Git Large File Handling Setup

This document explains the Git configuration for handling large files in the Buzzaz React project.

## Overview

This project is configured with:
- **Pre-commit hook**: Blocks files over 100MB from being committed
- **Git LFS**: Tracks `.mp4` and `.zip` files using Git Large File Storage
- **Comprehensive .gitignore**: Excludes common large files and build artifacts

## Files Created

### 1. `.gitignore`
Comprehensive ignore rules for:
- Node.js dependencies and build artifacts
- Large media files (videos, audio, images)
- Archive files
- Database files
- OS-generated files
- IDE files
- Project-specific uploads and builds

### 2. `.git/hooks/pre-commit`
A bash script that:
- Checks all files being committed for size
- Blocks commits containing files over 100MB
- Provides helpful error messages and solutions
- Works on Windows Git Bash, macOS, and Linux

### 3. `.gitattributes`
Git LFS configuration that automatically tracks:
- `*.mp4` files
- `*.zip` files

## How It Works

### Pre-commit Hook
When you run `git commit`, the hook automatically:
1. Scans all staged files
2. Checks their sizes
3. If any file is over 100MB:
   - Shows which files are too large
   - Provides solutions (LFS, .gitignore, or removal)
   - Blocks the commit

### Git LFS
Files matching the patterns in `.gitattributes` are automatically:
- Stored in Git LFS instead of the main repository
- Downloaded on-demand when you clone or checkout
- Tracked with pointer files in the main repository

## Team Setup Instructions

### For New Team Members

1. **Clone the repository** (if not already done):
   ```bash
   git clone <repository-url>
   cd buzzaz-react
   ```

2. **Install Git LFS** (if not already installed):
   ```bash
   # Windows (using Git for Windows)
   # Git LFS is usually included with Git for Windows
   
   # macOS
   brew install git-lfs
   
   # Ubuntu/Debian
   sudo apt install git-lfs
   ```

3. **Initialize Git LFS** in your local repository:
   ```bash
   git lfs install
   ```

4. **Pull any existing LFS files**:
   ```bash
   git lfs pull
   ```

### For Existing Team Members

If you already have the repository cloned:

1. **Pull the latest changes**:
   ```bash
   git pull origin main
   ```

2. **Install Git LFS** (if not already installed) - see instructions above

3. **Initialize Git LFS**:
   ```bash
   git lfs install
   ```

4. **Pull any LFS files**:
   ```bash
   git lfs pull
   ```

## Working with Large Files

### Adding New Large Files

#### For .mp4 and .zip files:
These are automatically tracked by LFS. Just add them normally:
```bash
git add video.mp4
git add archive.zip
git commit -m "Add video and archive files"
```

#### For other large files:
1. **Option 1: Add to Git LFS**
   ```bash
   git lfs track "*.pdf"  # Example for PDF files
   git add .gitattributes
   git add large-document.pdf
   git commit -m "Add PDF to LFS tracking"
   ```

2. **Option 2: Add to .gitignore**
   ```bash
   echo "large-file.bin" >> .gitignore
   git add .gitignore
   git commit -m "Ignore large binary file"
   ```

### If You Hit the 100MB Limit

When the pre-commit hook blocks your commit:

1. **Remove the file from staging**:
   ```bash
   git reset HEAD large-file.bin
   ```

2. **Choose a solution**:
   - **Use Git LFS**: `git lfs track "*.bin"` then add the file
   - **Add to .gitignore**: `echo "large-file.bin" >> .gitignore`
   - **Remove the file**: Delete it if it shouldn't be tracked

## Checking LFS Status

### View LFS-tracked files:
```bash
git lfs ls-files
```

### View LFS tracking patterns:
```bash
git lfs track
```

### Check LFS storage usage:
```bash
git lfs env
```

## Troubleshooting

### Pre-commit Hook Not Running
If the pre-commit hook isn't working:
```bash
# Check if the hook file exists and is executable
ls -la .git/hooks/pre-commit

# On Windows, ensure it has proper permissions
icacls ".git\hooks\pre-commit" /grant Everyone:F
```

### LFS Files Not Downloading
If LFS files aren't downloading:
```bash
# Force download all LFS files
git lfs pull

# Download specific LFS files
git lfs pull --include="*.mp4"
```

### Hook Shows Wrong File Sizes
The hook uses different commands on different systems:
- Windows: `stat -c%s`
- macOS/Linux: `stat -f%z` or `stat -c%s`

If you encounter issues, the hook should automatically detect your system.

## Best Practices

1. **Keep repositories lean**: Use .gitignore for files that don't need versioning
2. **Use LFS for binary files**: Especially media files, archives, and large datasets
3. **Regular cleanup**: Periodically review and clean up unnecessary files
4. **Team communication**: Inform team members when adding new LFS tracking patterns

## File Size Guidelines

- **< 1MB**: Regular Git tracking (fine for source code, configs)
- **1MB - 100MB**: Consider Git LFS for binary files
- **> 100MB**: Must use Git LFS or .gitignore (blocked by pre-commit hook)

## Support

If you encounter issues with this setup:
1. Check this documentation first
2. Try the troubleshooting steps above
3. Ask the team for help
4. Check Git LFS documentation: https://git-lfs.github.io/

## Configuration Files Reference

- **`.gitignore`**: Defines which files Git should ignore
- **`.gitattributes`**: Defines which files should use Git LFS
- **`.git/hooks/pre-commit`**: Script that runs before each commit
- **`GIT_LARGE_FILE_SETUP.md`**: This documentation file