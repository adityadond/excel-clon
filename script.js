
 const $ = require("jquery");
let fs =require("fs");
 const dialog=require("electron").remote.dialog;
 let sheetDB=[];
 let db;// current DB
 let lsc;

$(document).ready(function () {

    $(".content").on("scroll", function(){
        let l=$(this).scrollLeft();
        let t=$(this).scrollTop();
        $(".top-row").css("top",t+"px");
        $(".top-left-cell").css("top",t+"px");

        $(".left-col").css("left", l+"px");
        $(".top-left-cell").css("left", l+"px");
    })
     
    $(".add-sheet").on("click", function(){
        //remove active sheet-class from exting
        $(".sheet-list .sheet.active-sheet").removeClass("active-sheet");
        //append new div with active-sheet class to sheet-list
        let sheet=`<div class="sheet active-sheet" sid=${sheetDB.length}>sheet ${sheetDB.length+1}</div>`;
        $(".sheet-list").append(sheet);
        //add event after add sheet due in event not add in bellow

        $(".sheet").on("click",function(){
            
            let hasclass=$(this).hasClass("active-sheet");
        if(!hasclass)
            {
               $(".sheet.active-sheet").removeClass("active-sheet");
               $(this).addClass("active-sheet");
               let sheetID=Number($(this).attr("sid"));
               db=sheetDB[sheetID];
               for(let i=0;i<100;i++)
               {
                   for(let j=0;j<26;j++)
                   {
                       let cellobject=db[i][j];
                       $(`.cell[rid=${i} ][cid=${j}]`).text(cellobject.value);
                   }
               }
            }
            
        })

        //new db add into sheetDB.
        init();
        //update UI
        $("#address").val("");
        for(let i=0;i<100;i++)
        {
            for(let j=0;j<26;j++)
            {
                $(`.cell[rid=${i} ][cid=${j}]`).text("");
            }
        }
    })
    $(".sheet.active-class").on("click",function(){
        let hasclass=$(this).hasClass("active-sheet");
        if(!hasclass)
            {
               $(".sheet.active-sheet").removeClass("active-sheet");
               $(this).addClass("active-sheet");
               let sheetID=Number($(this).attr("sid"));
               db=sheetDB[sheetID];
               for(let i=0;i<100;i++)
               {
                   for(let j=0;j<26;j++)
                   {
                       let cellobject=db[i][j];
                       $(`.cell[rid=${i} ][cid=${j}]`).text(cellobject.value);
                   }
               }
            }
    })

    $(".new").on("click",function(){
        
        db=[];
        $("#address").val("");
        for(let i=0;i<100;i++)
        {
            row=[];
            for(let j=0;j<26;j++)
            {
                let cellad=String.fromCharCode(65+j)+(i+1);
                    cellobject={
                        name:cellad,
                        value:"",
                        formula:"",
                        parents:[],
                        childs:[]
                            }
                row.push(cellobject);
                $(`.cell[rid=${i} ][cid=${j}]`).text("");
            }
            db.push(row);
        }
    })
    $(".open").on("click",function(){
        let filepath=dialog.showSaveDialogSync();
        if(filepath)
        {
            let data=fs.readFileSync(filepath);
        let newdata=JSON.parse(data);
        db=newdata;
        for(let i=0;i<100;i++)
        {
            for(let j=0;j<26;j++)
            {
                let cellobject=db[i][j];
                $(`.cell[rid=${i} ][cid=${j}]`).text(cellobject.value);
            }
        }
        
        }
        
    })
    $(".save").on("click",function(){
        let data=JSON.stringify(db);
        let path=dialog.showSaveDialogSync();
        if(path)
        {
            fs.writeFileSync(path,data);
        }
       
    })

    $(".File").on("click",function(){
        $(".file-menu-option").addClass("active");
        $(".Home-menu-option").removeClass("active");
        $(".File").addClass("active-menu");
        $(".Home").removeClass("active-menu");

    })
    $(".Home").on("click",function(){
        $(".file-menu-option").removeClass("active");
        $(".Home-menu-option").addClass("active");
        $(".Home").addClass("active-menu");
        $(".File").removeClass("active-menu");

    })

    $(".cell").on("keyup",function(){
       let h= $(this).height();
       let rowid=$(this).attr("rid");
       $(`.left-col-cell[cellid=${rowid}]`).height(h);
    })

   $(".cell").on("click",function(){
       
       let rowid=Number($(this).attr("rid"));
       let colid=Number($(this).attr("cid"));
       let celladd=String.fromCharCode(65+colid)+(rowid+1);
       $("#address").val(celladd);
       let cellobject=db[rowid][colid];
       $("#formula").val(cellobject.formula);
       

   })
    $("#formula").on("blur", function(){
        let formula=$(this).val();
        //getting value of formala;
        
      
      // db upadte
        let address=$("#address").val();
        let {rowid,colid}=getids(address);
        let cellobject=db[rowid][colid];
        if(cellobject.formula!=formula)
        {
            // this will help in 4th case in which if we change formula then we have to call removeformula function.
            removeformula(cellobject);
            let value=solvef(formula,cellobject);
            cellobject.value=value+"";
            cellobject.formula=formula;
            // this will add case of value->formula 
           updatechild(cellobject);
            //UI update
            $(lsc).text(value);
        }
      
        })

        function solvef(formula, cellobject)
        {
            let fcmps=formula.split(" ");
            for(let i=0;i<fcmps.length;i++)
            {
                let fcomp=fcmps[i];
                let cellname=fcomp[0];
                if(cellname>='A' && cellname<='Z')
                {
                    let {rowid, colid}=getids(fcomp);
                    let parentcellobject=  db[rowid][colid];
                    if(cellobject)
                    {
                       
                        // add self into children into parentcellobject
                        addCtoPO(parentcellobject,cellobject);
    
                        //add parent into childobject
                        addPtoCO(fcomp,cellobject);
                    }
                    
                    
                    let value=parentcellobject.value;
                    formula=formula.replace(fcomp, value);
                }
            }
            let value=eval(formula);
            return value;
        }

        function addCtoPO(parentcellobject,cellobject)
        {
            parentcellobject.childs.push(cellobject.name);
        }
        function addPtoCO(fcomp,cellobject)
        {
            cellobject.parents.push(fcomp);
        }
// this fuction gives value for dataase .
        function getids(fcomp)
        {
            let colid=fcomp.charCodeAt(0)-65;
            let rowid=Number(fcomp.substring(1))-1;
            return {rowid:rowid,colid:colid};
        }



//this will give update value at your databse
$(".cell").on("blur",function(){
    lsc=$(this);
    let val=$(this).text();
    let rowid=Number($(this).attr("rid"));
    let colid=Number($(this).attr("cid"));
    let cellobject=db[rowid][colid];
   if(cellobject.value!=val)
   {
    cellobject.value=val;
    //this will 
    if(cellobject.formula)
    {
        removeformula(cellobject);
    }
    //this will update childs when we change its parents
    updatechild(cellobject);
   }
})
function removeformula(cellobject)
{
    cellobject.formula="";
    for(let i=0;i<cellobject.parents.length;i++)
    {
        let parentname=cellobject.parents[i];
        let {rowid, colid}=getids(parentname);
        let parentcellobject=db[rowid][colid];
        let filterdta=parentcellobject.childs.filter(function(child){
            return cellobject.name!=child;
        })
        parentcellobject.childs=filterdta;
    }
    cellobject.parents=[];
}
function updatechild(cellobject)
{
for(let i=0;i<cellobject.childs.length;i++)
{
    let child=cellobject.childs[i];
    let {rowid,colid}=getids(child);
    let childobject=db[rowid][colid];
    let value=solvef(childobject.formula);
    //db update
    childobject.value=value+"";
    //Ui update
    $(`.cell[rid=${rowid}][cid=${colid}]`).text(value);
    // if childobject having its own child then we have call function again ,here we use for loop so no need of base case.
    updatechild(childobject);

}


}

// this will create a DB for store cell data;
   function init()
   {
   newdb=[];
   for(let i=0;i<100;i++)
   {
       row=[];
       for(let j=0;j<26;j++)
       {
           let cellad=String.fromCharCode(65+j)+(i+1);
               cellobject={
                   name:cellad,
                   value:"",
                   formula:"",
                   parents:[],
                   childs:[]
                       }
           row.push(cellobject);
          
       }
       newdb.push(row);
   }
   db=newdb;
  sheetDB.push(db);
   console.log(sheetDB);
   }
   init();
})
