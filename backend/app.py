from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.responses import FileResponse
from typing import List
import tempfile
import shutil
import os
import sys
import subprocess

app = FastAPI()


@app.post("/api/merge")
async def merge(files: List[UploadFile] = File(...)):
    if not files or len(files) < 2:
        raise HTTPException(status_code=400, detail="Upload at least two PDF files")

    tmpdir = tempfile.mkdtemp()
    try:
        input_paths = []
        for f in files:
            out_path = os.path.join(tmpdir, f.filename)
            with open(out_path, "wb") as fh:
                content = await f.read()
                fh.write(content)
            input_paths.append(out_path)

        output_path = os.path.join(tmpdir, "merged_output.pdf")

        # Attempt to import combinePdfs from the absolute path provided by the user .
        try:
            user_module_dir = r"C:\\MyStuff\\pythonSpace"
            if user_module_dir not in sys.path:
                sys.path.append(user_module_dir)
            import combinePdfs

            # Try common function signatures
            if hasattr(combinePdfs, 'merge_pdfs'):
                combinePdfs.merge_pdfs(input_paths, output_path)
            elif hasattr(combinePdfs, 'main'):
                try:
                    combinePdfs.main(input_paths, output_path)
                except TypeError:
                    # try calling with stdout path
                    combinePdfs.main(input_paths, output_path)
            else:
                # fallback to subprocess if no callable found
                raise ImportError('No known entry point in combinePdfs')
        except Exception:
            # fallback: try running script via subprocess
            script_path = os.path.join(r"C:\\MyStuff\\pythonSpace", "combinePdfs.py")
            cmd = [sys.executable, script_path, *input_paths, "-o", output_path]
            subprocess.run(cmd, check=True)

        if not os.path.exists(output_path):
            raise HTTPException(status_code=500, detail="Merging failed; output not produced")

        return FileResponse(output_path, filename="merged.pdf", media_type='application/pdf')

    except subprocess.CalledProcessError as e:
        raise HTTPException(status_code=500, detail=f"Subprocess error: {e}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        # Note: we keep tmpdir briefly; FastAPI will still serve file. Optionally cleanup.
        pass
