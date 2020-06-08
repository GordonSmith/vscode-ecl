// Generated from ./Salt.g4 by ANTLR 4.7.2
// jshint ignore: start
var antlr4 = require('antlr4/index');

// This class defines a complete generic visitor for a parse tree produced by SaltParser.

function SaltVisitor() {
	antlr4.tree.ParseTreeVisitor.call(this);
	return this;
}

SaltVisitor.prototype = Object.create(antlr4.tree.ParseTreeVisitor.prototype);
SaltVisitor.prototype.constructor = SaltVisitor;

// Visit a parse tree produced by SaltParser#spc.
SaltVisitor.prototype.visitSpc = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by SaltParser#LiModule.
SaltVisitor.prototype.visitLiModule = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by SaltParser#LiIdName.
SaltVisitor.prototype.visitLiIdName = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by SaltParser#LiRidfield.
SaltVisitor.prototype.visitLiRidfield = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by SaltParser#LiIdField.
SaltVisitor.prototype.visitLiIdField = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by SaltParser#LiNumLine.
SaltVisitor.prototype.visitLiNumLine = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by SaltParser#LiField.
SaltVisitor.prototype.visitLiField = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by SaltParser#LiIdAttribute.
SaltVisitor.prototype.visitLiIdAttribute = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by SaltParser#LiAttribute.
SaltVisitor.prototype.visitLiAttribute = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by SaltParser#LiDates.
SaltVisitor.prototype.visitLiDates = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by SaltParser#LiIngestMode.
SaltVisitor.prototype.visitLiIngestMode = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by SaltParser#LiIdList.
SaltVisitor.prototype.visitLiIdList = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by SaltParser#LiDocField.
SaltVisitor.prototype.visitLiDocField = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by SaltParser#LiProcess.
SaltVisitor.prototype.visitLiProcess = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by SaltParser#LiLinkPath.
SaltVisitor.prototype.visitLiLinkPath = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by SaltParser#LiFormat.
SaltVisitor.prototype.visitLiFormat = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by SaltParser#LiOptions.
SaltVisitor.prototype.visitLiOptions = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by SaltParser#LiHack.
SaltVisitor.prototype.visitLiHack = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by SaltParser#LiMatchStrat.
SaltVisitor.prototype.visitLiMatchStrat = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by SaltParser#LiSkip.
SaltVisitor.prototype.visitLiSkip = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by SaltParser#DistFlag.
SaltVisitor.prototype.visitDistFlag = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by SaltParser#DistDouble.
SaltVisitor.prototype.visitDistDouble = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by SaltParser#DistSkip.
SaltVisitor.prototype.visitDistSkip = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by SaltParser#buckets_option.
SaltVisitor.prototype.visitBuckets_option = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by SaltParser#continuous_bucket_innards.
SaltVisitor.prototype.visitContinuous_bucket_innards = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by SaltParser#bucket_option.
SaltVisitor.prototype.visitBucket_option = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by SaltParser#discrete_bucket_innards.
SaltVisitor.prototype.visitDiscrete_bucket_innards = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by SaltParser#IngmodeDates.
SaltVisitor.prototype.visitIngmodeDates = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by SaltParser#IngmodeFlag.
SaltVisitor.prototype.visitIngmodeFlag = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by SaltParser#IngmodeField.
SaltVisitor.prototype.visitIngmodeField = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by SaltParser#format_options.
SaltVisitor.prototype.visitFormat_options = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by SaltParser#errinfo_options.
SaltVisitor.prototype.visitErrinfo_options = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by SaltParser#FlDataset.
SaltVisitor.prototype.visitFlDataset = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by SaltParser#FlField.
SaltVisitor.prototype.visitFlField = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by SaltParser#FlSkip.
SaltVisitor.prototype.visitFlSkip = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by SaltParser#VFieldID.
SaltVisitor.prototype.visitVFieldID = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by SaltParser#VFieldSkip.
SaltVisitor.prototype.visitVFieldSkip = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by SaltParser#concat_option.
SaltVisitor.prototype.visitConcat_option = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by SaltParser#delimiter_option.
SaltVisitor.prototype.visitDelimiter_option = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by SaltParser#virtual_field_piece.
SaltVisitor.prototype.visitVirtual_field_piece = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by SaltParser#pad_option.
SaltVisitor.prototype.visitPad_option = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by SaltParser#DSTypeNum.
SaltVisitor.prototype.visitDSTypeNum = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by SaltParser#DSTypeFlag.
SaltVisitor.prototype.visitDSTypeFlag = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by SaltParser#DSTypeCustom.
SaltVisitor.prototype.visitDSTypeCustom = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by SaltParser#DSTypeSkip.
SaltVisitor.prototype.visitDSTypeSkip = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by SaltParser#DSFlag.
SaltVisitor.prototype.visitDSFlag = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by SaltParser#DSSkip.
SaltVisitor.prototype.visitDSSkip = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by SaltParser#match_option.
SaltVisitor.prototype.visitMatch_option = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by SaltParser#match_line.
SaltVisitor.prototype.visitMatch_line = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by SaltParser#mesep.
SaltVisitor.prototype.visitMesep = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by SaltParser#meeq.
SaltVisitor.prototype.visitMeeq = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by SaltParser#leftterm.
SaltVisitor.prototype.visitLeftterm = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by SaltParser#rightterm.
SaltVisitor.prototype.visitRightterm = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by SaltParser#trail_spec.
SaltVisitor.prototype.visitTrail_spec = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by SaltParser#optionitem.
SaltVisitor.prototype.visitOptionitem = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by SaltParser#option_item.
SaltVisitor.prototype.visitOption_item = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by SaltParser#hackflag.
SaltVisitor.prototype.visitHackflag = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by SaltParser#hacknum.
SaltVisitor.prototype.visitHacknum = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by SaltParser#hackmaxblock.
SaltVisitor.prototype.visitHackmaxblock = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by SaltParser#hackid.
SaltVisitor.prototype.visitHackid = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by SaltParser#hackacw_option.
SaltVisitor.prototype.visitHackacw_option = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by SaltParser#cluster_option.
SaltVisitor.prototype.visitCluster_option = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by SaltParser#cluster_basis_item.
SaltVisitor.prototype.visitCluster_basis_item = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by SaltParser#ignorelp_option.
SaltVisitor.prototype.visitIgnorelp_option = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by SaltParser#efskip.
SaltVisitor.prototype.visitEfskip = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by SaltParser#efflag.
SaltVisitor.prototype.visitEfflag = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by SaltParser#efsearch.
SaltVisitor.prototype.visitEfsearch = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by SaltParser#efignore.
SaltVisitor.prototype.visitEfignore = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by SaltParser#efpriority.
SaltVisitor.prototype.visitEfpriority = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by SaltParser#efnum.
SaltVisitor.prototype.visitEfnum = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by SaltParser#efignorelp.
SaltVisitor.prototype.visitEfignorelp = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by SaltParser#efflagflag.
SaltVisitor.prototype.visitEfflagflag = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by SaltParser#efpermit.
SaltVisitor.prototype.visitEfpermit = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by SaltParser#efchild.
SaltVisitor.prototype.visitEfchild = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by SaltParser#efmapping.
SaltVisitor.prototype.visitEfmapping = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by SaltParser#efmulti.
SaltVisitor.prototype.visitEfmulti = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by SaltParser#ef_like_option.
SaltVisitor.prototype.visitEf_like_option = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by SaltParser#ef_searchon_option.
SaltVisitor.prototype.visitEf_searchon_option = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by SaltParser#ef_multi_option.
SaltVisitor.prototype.visitEf_multi_option = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by SaltParser#mapping_guts.
SaltVisitor.prototype.visitMapping_guts = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by SaltParser#eq.
SaltVisitor.prototype.visitEq = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by SaltParser#ingskip.
SaltVisitor.prototype.visitIngskip = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by SaltParser#ingflag.
SaltVisitor.prototype.visitIngflag = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by SaltParser#ingspray.
SaltVisitor.prototype.visitIngspray = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by SaltParser#ingid.
SaltVisitor.prototype.visitIngid = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by SaltParser#ingfixed.
SaltVisitor.prototype.visitIngfixed = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by SaltParser#ingcsv.
SaltVisitor.prototype.visitIngcsv = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by SaltParser#csv_options.
SaltVisitor.prototype.visitCsv_options = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by SaltParser#atskip.
SaltVisitor.prototype.visitAtskip = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by SaltParser#atvalues.
SaltVisitor.prototype.visitAtvalues = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by SaltParser#atidparam.
SaltVisitor.prototype.visitAtidparam = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by SaltParser#atnumparam.
SaltVisitor.prototype.visitAtnumparam = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by SaltParser#atflagflag.
SaltVisitor.prototype.visitAtflagflag = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by SaltParser#atsearch.
SaltVisitor.prototype.visitAtsearch = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by SaltParser#atdates.
SaltVisitor.prototype.visitAtdates = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by SaltParser#attr_element.
SaltVisitor.prototype.visitAttr_element = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by SaltParser#list_flag.
SaltVisitor.prototype.visitList_flag = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by SaltParser#efficacy_options.
SaltVisitor.prototype.visitEfficacy_options = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by SaltParser#seeneff_dates.
SaltVisitor.prototype.visitSeeneff_dates = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by SaltParser#asof_options.
SaltVisitor.prototype.visitAsof_options = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by SaltParser#rttag.
SaltVisitor.prototype.visitRttag = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by SaltParser#rtflag.
SaltVisitor.prototype.visitRtflag = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by SaltParser#rtcondition.
SaltVisitor.prototype.visitRtcondition = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by SaltParser#rtonfail.
SaltVisitor.prototype.visitRtonfail = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by SaltParser#rtvalid.
SaltVisitor.prototype.visitRtvalid = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by SaltParser#valid_childref.
SaltVisitor.prototype.visitValid_childref = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by SaltParser#condition_operator.
SaltVisitor.prototype.visitCondition_operator = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by SaltParser#gt_operator.
SaltVisitor.prototype.visitGt_operator = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by SaltParser#lt_operator.
SaltVisitor.prototype.visitLt_operator = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by SaltParser#linkpath_options.
SaltVisitor.prototype.visitLinkpath_options = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by SaltParser#RelationshipSkip.
SaltVisitor.prototype.visitRelationshipSkip = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by SaltParser#RelationshipNum.
SaltVisitor.prototype.visitRelationshipNum = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by SaltParser#RelationshipFlagFlag.
SaltVisitor.prototype.visitRelationshipFlagFlag = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by SaltParser#RelationshipFieldList.
SaltVisitor.prototype.visitRelationshipFieldList = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by SaltParser#RelationshipID.
SaltVisitor.prototype.visitRelationshipID = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by SaltParser#CleaveSkip.
SaltVisitor.prototype.visitCleaveSkip = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by SaltParser#CleaveFlag.
SaltVisitor.prototype.visitCleaveFlag = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by SaltParser#CleaveNum.
SaltVisitor.prototype.visitCleaveNum = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by SaltParser#CleaveFlagFlag.
SaltVisitor.prototype.visitCleaveFlagFlag = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by SaltParser#blocklink_option.
SaltVisitor.prototype.visitBlocklink_option = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by SaltParser#RangeFieldRange.
SaltVisitor.prototype.visitRangeFieldRange = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by SaltParser#RangeFieldFlag.
SaltVisitor.prototype.visitRangeFieldFlag = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by SaltParser#RangeFieldNumParam.
SaltVisitor.prototype.visitRangeFieldNumParam = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by SaltParser#RangeFieldBasis.
SaltVisitor.prototype.visitRangeFieldBasis = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by SaltParser#RangeFieldContext.
SaltVisitor.prototype.visitRangeFieldContext = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by SaltParser#RangeFieldSkip.
SaltVisitor.prototype.visitRangeFieldSkip = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by SaltParser#SourceFieldPartition.
SaltVisitor.prototype.visitSourceFieldPartition = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by SaltParser#SourceFieldPermits.
SaltVisitor.prototype.visitSourceFieldPermits = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by SaltParser#SourceFieldConsistent.
SaltVisitor.prototype.visitSourceFieldConsistent = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by SaltParser#ConceptChildref.
SaltVisitor.prototype.visitConceptChildref = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by SaltParser#ConceptSkip.
SaltVisitor.prototype.visitConceptSkip = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by SaltParser#ConceptFlag.
SaltVisitor.prototype.visitConceptFlag = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by SaltParser#ConceptFlagFlag.
SaltVisitor.prototype.visitConceptFlagFlag = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by SaltParser#ConceptField.
SaltVisitor.prototype.visitConceptField = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by SaltParser#concept_childref.
SaltVisitor.prototype.visitConcept_childref = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by SaltParser#LatLongId.
SaltVisitor.prototype.visitLatLongId = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by SaltParser#LatLongNum.
SaltVisitor.prototype.visitLatLongNum = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by SaltParser#LatLongReal.
SaltVisitor.prototype.visitLatLongReal = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by SaltParser#LatLongSkip.
SaltVisitor.prototype.visitLatLongSkip = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by SaltParser#LatLongFlag.
SaltVisitor.prototype.visitLatLongFlag = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by SaltParser#date_field_options.
SaltVisitor.prototype.visitDate_field_options = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by SaltParser#FieldFlags.
SaltVisitor.prototype.visitFieldFlags = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by SaltParser#FieldContext.
SaltVisitor.prototype.visitFieldContext = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by SaltParser#FieldSkip.
SaltVisitor.prototype.visitFieldSkip = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by SaltParser#FieldOptOpt.
SaltVisitor.prototype.visitFieldOptOpt = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by SaltParser#FieldID.
SaltVisitor.prototype.visitFieldID = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by SaltParser#FieldTypeID.
SaltVisitor.prototype.visitFieldTypeID = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by SaltParser#FieldOptNum.
SaltVisitor.prototype.visitFieldOptNum = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by SaltParser#FieldNum.
SaltVisitor.prototype.visitFieldNum = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by SaltParser#FieldAbbr.
SaltVisitor.prototype.visitFieldAbbr = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by SaltParser#FieldPermitted.
SaltVisitor.prototype.visitFieldPermitted = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by SaltParser#FieldNulls.
SaltVisitor.prototype.visitFieldNulls = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by SaltParser#FieldMultiple.
SaltVisitor.prototype.visitFieldMultiple = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by SaltParser#FieldBestOrFuzzy.
SaltVisitor.prototype.visitFieldBestOrFuzzy = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by SaltParser#named_option.
SaltVisitor.prototype.visitNamed_option = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by SaltParser#bag_of_words.
SaltVisitor.prototype.visitBag_of_words = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by SaltParser#bag_of_words_type.
SaltVisitor.prototype.visitBag_of_words_type = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by SaltParser#bag_of_words_scale.
SaltVisitor.prototype.visitBag_of_words_scale = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by SaltParser#permitted_int.
SaltVisitor.prototype.visitPermitted_int = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by SaltParser#permitted_blank.
SaltVisitor.prototype.visitPermitted_blank = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by SaltParser#nulls_replace.
SaltVisitor.prototype.visitNulls_replace = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by SaltParser#multiple_many.
SaltVisitor.prototype.visitMultiple_many = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by SaltParser#SegrefSegment.
SaltVisitor.prototype.visitSegrefSegment = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by SaltParser#SegrefSegtype.
SaltVisitor.prototype.visitSegrefSegtype = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by SaltParser#rollup_option.
SaltVisitor.prototype.visitRollup_option = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by SaltParser#weight_option.
SaltVisitor.prototype.visitWeight_option = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by SaltParser#distrib_option.
SaltVisitor.prototype.visitDistrib_option = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by SaltParser#like_option.
SaltVisitor.prototype.visitLike_option = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by SaltParser#supports_option.
SaltVisitor.prototype.visitSupports_option = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by SaltParser#opt_id.
SaltVisitor.prototype.visitOpt_id = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by SaltParser#opt_id_list.
SaltVisitor.prototype.visitOpt_id_list = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by SaltParser#abbr_option.
SaltVisitor.prototype.visitAbbr_option = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by SaltParser#abbr_options.
SaltVisitor.prototype.visitAbbr_options = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by SaltParser#force_option.
SaltVisitor.prototype.visitForce_option = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by SaltParser#force_option_part.
SaltVisitor.prototype.visitForce_option_part = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by SaltParser#force_option_sign.
SaltVisitor.prototype.visitForce_option_sign = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by SaltParser#signed_num.
SaltVisitor.prototype.visitSigned_num = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by SaltParser#or_force_option.
SaltVisitor.prototype.visitOr_force_option = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by SaltParser#BestSkip.
SaltVisitor.prototype.visitBestSkip = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by SaltParser#BestFlag.
SaltVisitor.prototype.visitBestFlag = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by SaltParser#BestRecentEarly.
SaltVisitor.prototype.visitBestRecentEarly = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by SaltParser#BestValid.
SaltVisitor.prototype.visitBestValid = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by SaltParser#BestVoted.
SaltVisitor.prototype.visitBestVoted = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by SaltParser#BestCommonest.
SaltVisitor.prototype.visitBestCommonest = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by SaltParser#BestMinimum.
SaltVisitor.prototype.visitBestMinimum = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by SaltParser#FuzzyFlag.
SaltVisitor.prototype.visitFuzzyFlag = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by SaltParser#FuzzyId.
SaltVisitor.prototype.visitFuzzyId = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by SaltParser#FuzzyWeight.
SaltVisitor.prototype.visitFuzzyWeight = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by SaltParser#FuzzySkip.
SaltVisitor.prototype.visitFuzzySkip = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by SaltParser#FieldTypeBrackets.
SaltVisitor.prototype.visitFieldTypeBrackets = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by SaltParser#FieldTypeFlags.
SaltVisitor.prototype.visitFieldTypeFlags = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by SaltParser#FieldTypeLike.
SaltVisitor.prototype.visitFieldTypeLike = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by SaltParser#FieldTypeEnum.
SaltVisitor.prototype.visitFieldTypeEnum = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by SaltParser#FieldTypeWithin.
SaltVisitor.prototype.visitFieldTypeWithin = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by SaltParser#FieldTypeOnfail.
SaltVisitor.prototype.visitFieldTypeOnfail = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by SaltParser#FieldTypeParse.
SaltVisitor.prototype.visitFieldTypeParse = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by SaltParser#FieldTypeNumberlist.
SaltVisitor.prototype.visitFieldTypeNumberlist = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by SaltParser#FieldTypeInrange.
SaltVisitor.prototype.visitFieldTypeInrange = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by SaltParser#FieldTypeDate.
SaltVisitor.prototype.visitFieldTypeDate = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by SaltParser#FieldTypeRegex.
SaltVisitor.prototype.visitFieldTypeRegex = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by SaltParser#FieldTypeCustomClean.
SaltVisitor.prototype.visitFieldTypeCustomClean = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by SaltParser#FieldTypeSkip.
SaltVisitor.prototype.visitFieldTypeSkip = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by SaltParser#FieldTypeCustom.
SaltVisitor.prototype.visitFieldTypeCustom = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by SaltParser#enum_detect_option.
SaltVisitor.prototype.visitEnum_detect_option = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by SaltParser#FieldTypeDetectEnum.
SaltVisitor.prototype.visitFieldTypeDetectEnum = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by SaltParser#FieldTypeDetectFlag.
SaltVisitor.prototype.visitFieldTypeDetectFlag = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by SaltParser#FieldTypeDetectSkip.
SaltVisitor.prototype.visitFieldTypeDetectSkip = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by SaltParser#onfail_flag.
SaltVisitor.prototype.visitOnfail_flag = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by SaltParser#onfail_default.
SaltVisitor.prototype.visitOnfail_default = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by SaltParser#maxblocksize.
SaltVisitor.prototype.visitMaxblocksize = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by SaltParser#parse_option.
SaltVisitor.prototype.visitParse_option = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by SaltParser#parse_attr.
SaltVisitor.prototype.visitParse_attr = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by SaltParser#parse_auto.
SaltVisitor.prototype.visitParse_auto = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by SaltParser#recorddate_option.
SaltVisitor.prototype.visitRecorddate_option = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by SaltParser#strictdate.
SaltVisitor.prototype.visitStrictdate = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by SaltParser#replace_section.
SaltVisitor.prototype.visitReplace_section = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by SaltParser#goes_to.
SaltVisitor.prototype.visitGoes_to = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by SaltParser#periodic_ids_param.
SaltVisitor.prototype.visitPeriodic_ids_param = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by SaltParser#numberlist.
SaltVisitor.prototype.visitNumberlist = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by SaltParser#intrange.
SaltVisitor.prototype.visitIntrange = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by SaltParser#opt_param.
SaltVisitor.prototype.visitOpt_param = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by SaltParser#id_param.
SaltVisitor.prototype.visitId_param = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by SaltParser#num_param.
SaltVisitor.prototype.visitNum_param = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by SaltParser#neg_num_param.
SaltVisitor.prototype.visitNeg_num_param = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by SaltParser#custom_attr.
SaltVisitor.prototype.visitCustom_attr = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by SaltParser#custom_attr_ft.
SaltVisitor.prototype.visitCustom_attr_ft = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by SaltParser#custom_attr_dt.
SaltVisitor.prototype.visitCustom_attr_dt = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by SaltParser#nestedclass.
SaltVisitor.prototype.visitNestedclass = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by SaltParser#mixed_params.
SaltVisitor.prototype.visitMixed_params = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by SaltParser#param.
SaltVisitor.prototype.visitParam = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by SaltParser#signed_real.
SaltVisitor.prototype.visitSigned_real = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by SaltParser#real.
SaltVisitor.prototype.visitReal = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by SaltParser#dashed_id.
SaltVisitor.prototype.visitDashed_id = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by SaltParser#id_spec_list.
SaltVisitor.prototype.visitId_spec_list = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by SaltParser#id_spec.
SaltVisitor.prototype.visitId_spec = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by SaltParser#id_comma_list.
SaltVisitor.prototype.visitId_comma_list = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by SaltParser#id_list.
SaltVisitor.prototype.visitId_list = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by SaltParser#basis_option.
SaltVisitor.prototype.visitBasis_option = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by SaltParser#basis_list.
SaltVisitor.prototype.visitBasis_list = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by SaltParser#basis_element.
SaltVisitor.prototype.visitBasis_element = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by SaltParser#basis_qualifier.
SaltVisitor.prototype.visitBasis_qualifier = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by SaltParser#signed_int.
SaltVisitor.prototype.visitSigned_int = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by SaltParser#periodic_ids.
SaltVisitor.prototype.visitPeriodic_ids = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by SaltParser#stuff_in_brackets.
SaltVisitor.prototype.visitStuff_in_brackets = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by SaltParser#stuff_escape_brackets.
SaltVisitor.prototype.visitStuff_escape_brackets = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by SaltParser#nonempty_stuff_in_brackets.
SaltVisitor.prototype.visitNonempty_stuff_in_brackets = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by SaltParser#nonempty_stuff_escape_brackets.
SaltVisitor.prototype.visitNonempty_stuff_escape_brackets = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by SaltParser#custinfo_options.
SaltVisitor.prototype.visitCustinfo_options = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by SaltParser#custinfo_option.
SaltVisitor.prototype.visitCustinfo_option = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by SaltParser#useon.
SaltVisitor.prototype.visitUseon = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by SaltParser#useon_option.
SaltVisitor.prototype.visitUseon_option = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by SaltParser#useon_stuff.
SaltVisitor.prototype.visitUseon_stuff = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by SaltParser#optiontext.
SaltVisitor.prototype.visitOptiontext = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by SaltParser#rttag_param.
SaltVisitor.prototype.visitRttag_param = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by SaltParser#restofline.
SaltVisitor.prototype.visitRestofline = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by SaltParser#nl.
SaltVisitor.prototype.visitNl = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by SaltParser#lp.
SaltVisitor.prototype.visitLp = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by SaltParser#rp.
SaltVisitor.prototype.visitRp = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by SaltParser#co.
SaltVisitor.prototype.visitCo = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by SaltParser#comma.
SaltVisitor.prototype.visitComma = function(ctx) {
  return this.visitChildren(ctx);
};


// Visit a parse tree produced by SaltParser#pip_string.
SaltVisitor.prototype.visitPip_string = function(ctx) {
  return this.visitChildren(ctx);
};



exports.SaltVisitor = SaltVisitor;